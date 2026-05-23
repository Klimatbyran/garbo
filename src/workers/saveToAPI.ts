import { PipelineJob, PipelineWorker } from '../lib/PipelineWorker'
import { apiFetch } from '../lib/api'
import { QUEUE_NAMES } from '../queues'
import { registryService } from '../api/services/registryService'
import { canonicalPublicReportUrl } from '../lib/saveUtils'
import { createServerCache } from '../createCache'
import { invalidateRegistryCache } from '../api/services/registryCache'

const registryCache = createServerCache({ maxAge: 24 * 60 * 60 * 1000 })

export interface SaveToApiJob extends PipelineJob {
  data: PipelineJob['data'] & {
    companyName?: string
    body: any
    wikidata: { node: string }
    apiSubEndpoint: string
    /** Original report URL when pipeline cached PDF to S3 (parsePdf). */
    sourceUrl?: string
    /** Cached/uploaded PDF storage metadata from pipeline-api (when available). */
    pdfCache?: {
      publicUrl?: string
      sha256?: string
    }
  }
}

function isWikidataQId(wikidataId: string): boolean {
  return /^Q\d+$/i.test(wikidataId.trim())
}

function pickRegistryPayloadFromReportingPeriodsSave(
  job: SaveToApiJob
): null | {
  companyName: string
  wikidataId: string
  reportYear?: string
  url: string
  sourceUrl?: string
  s3Url?: string
  sha256?: string
} {
  const companyName = job.data.companyName
  if (!companyName) return null

  const wikidataId = job.data.wikidata.node.trim()
  if (!isWikidataQId(wikidataId)) return null

  const url = typeof job.data.url === 'string' ? job.data.url.trim() : ''
  const sourceUrl =
    typeof job.data.sourceUrl === 'string'
      ? job.data.sourceUrl.trim()
      : undefined
  const pdfCache = job.data.pdfCache

  const reportingPeriods = job.data.body?.reportingPeriods
  if (!Array.isArray(reportingPeriods) || reportingPeriods.length === 0)
    return null

  const canonicalReportUrl = canonicalPublicReportUrl({ url, sourceUrl })

  const sha256FromPdfCache =
    typeof pdfCache?.sha256 === 'string' && pdfCache.sha256.trim()
      ? pdfCache.sha256.trim()
      : undefined

  const s3UrlFromPdfCache =
    typeof pdfCache?.publicUrl === 'string' && pdfCache.publicUrl.trim()
      ? pdfCache.publicUrl.trim()
      : undefined

  const sourceIsHttp =
    typeof sourceUrl === 'string' && /^https?:\/\//i.test(sourceUrl)

  const s3UrlFromJobUrl =
    url && (!sourceIsHttp || url !== sourceUrl) ? url : undefined

  const expectedS3Url = s3UrlFromPdfCache || s3UrlFromJobUrl

  const normalizeYear = (year: any): string | undefined => {
    if (typeof year === 'number') return year.toString()
    if (typeof year === 'string') return year
    return undefined
  }

  const maxYear = reportingPeriods.reduce(
    (max: number | null, rp: any) => {
      const y = Number(rp?.year)
      if (!Number.isFinite(y)) return max
      if (max === null) return y
      return Math.max(max, y)
    },
    null as number | null
  )

  const chosen =
    (sha256FromPdfCache
      ? reportingPeriods.find(
          (rp: any) =>
            typeof rp?.reportSha256 === 'string' &&
            rp.reportSha256.trim() === sha256FromPdfCache
        )
      : null) ||
    (expectedS3Url
      ? reportingPeriods.find(
          (rp: any) =>
            typeof rp?.reportS3Url === 'string' &&
            rp.reportS3Url.trim() === expectedS3Url
        )
      : null) ||
    reportingPeriods.find(
      (rp: any) =>
        typeof rp?.reportURL === 'string' &&
        rp.reportURL.trim() === canonicalReportUrl
    ) ||
    reportingPeriods.find(
      (rp: any) => typeof rp?.reportURL === 'string' && rp.reportURL.trim()
    ) ||
    reportingPeriods[0]

  const reportYear =
    normalizeYear(chosen?.year) ??
    (maxYear !== null ? maxYear.toString() : undefined)

  const reportURL =
    typeof chosen?.reportURL === 'string' && chosen.reportURL.trim()
      ? chosen.reportURL.trim()
      : canonicalReportUrl

  const reportS3Url =
    typeof chosen?.reportS3Url === 'string' && chosen.reportS3Url.trim()
      ? chosen.reportS3Url.trim()
      : undefined

  const reportSha256 =
    typeof chosen?.reportSha256 === 'string' && chosen.reportSha256.trim()
      ? chosen.reportSha256.trim()
      : undefined

  const trimmedUrl = url || reportURL
  if (!trimmedUrl) return null

  const s3Url =
    reportS3Url ||
    s3UrlFromPdfCache ||
    (trimmedUrl && (!sourceIsHttp || trimmedUrl !== sourceUrl)
      ? trimmedUrl
      : undefined)

  const sha256 = sha256FromPdfCache ?? reportSha256

  return {
    companyName,
    wikidataId,
    reportYear,
    url: trimmedUrl,
    sourceUrl: sourceIsHttp ? sourceUrl : undefined,
    s3Url,
    sha256,
  }
}

function removeNullValuesFromGarbo(
  data: any,
  preserveNullsInEmissions: boolean = false
): any {
  if (Array.isArray(data)) {
    const mapped = data.map((item) =>
      removeNullValuesFromGarbo(item, preserveNullsInEmissions)
    )

    //filtering out undefined values from arrays, but not nulls, if we are preserving nulls in emissions:
    return preserveNullsInEmissions
      ? mapped.filter((item) => item !== undefined)
      : mapped.filter((item) => item !== null && item !== undefined)
  } else if (typeof data === 'object' && data !== null) {
    const sanitizedObject = Object.entries(data).reduce(
      (acc, [key, value]) => {
        // For the emissions subtree, we preserve nulls and only remove undefined values
        if (key === 'emissions' && value && typeof value === 'object') {
          acc[key] = removeNullValuesFromGarbo(value, true)
          return acc
        }

        const sanitizedValue = removeNullValuesFromGarbo(
          value,
          preserveNullsInEmissions
        )
        //when working our way 'back up' from the bottom of the tree, we preserve children values that still have a null or a value.
        if (preserveNullsInEmissions) {
          if (sanitizedValue !== undefined) acc[key] = sanitizedValue
        } else {
          if (sanitizedValue !== null && sanitizedValue !== undefined)
            acc[key] = sanitizedValue
        }
        return acc
      },
      {} as Record<string, any>
    )

    if (preserveNullsInEmissions) {
      // In emissions subtree we never collapse empty objects to null
      return sanitizedObject
    }
    return Object.keys(sanitizedObject).length > 0 ? sanitizedObject : null
  } else {
    return data
  }
}

export const saveToAPI = new PipelineWorker<SaveToApiJob>(
  QUEUE_NAMES.SAVE_TO_API,
  async (job: SaveToApiJob) => {
    try {
      const { companyName, wikidata, body, apiSubEndpoint } = job.data
      const wikidataId = wikidata.node

      console.log(body)

      // remove all null values except for emissions where we want them to be explicit
      const sanitizedBody = removeNullValuesFromGarbo(body)

      // Coerce emissions.scope3: null -> {} so API accepts "explicitly none this year"
      const coerceNullScope3ToEmptyObject = (emissions?: any) => {
        if (!emissions || typeof emissions !== 'object') return
        if (emissions.scope3 === null) emissions.scope3 = {}
      }

      if (Array.isArray(sanitizedBody?.reportingPeriods)) {
        for (const rp of sanitizedBody.reportingPeriods) {
          coerceNullScope3ToEmptyObject(rp.emissions)
        }
      }

      job.log(`Saving approved data for ID:${wikidataId} company:${companyName} to API ${apiSubEndpoint}:
          ${JSON.stringify(sanitizedBody)}`)

      const method = apiSubEndpoint === 'tags' ? ('PATCH' as const) : undefined
      const endpoint =
        typeof apiSubEndpoint === 'string' && apiSubEndpoint.trim().length > 0
          ? `/companies/${wikidataId}/${apiSubEndpoint}`
          : `/companies/${wikidataId}`
      const chunk =
        typeof apiSubEndpoint === 'string' && apiSubEndpoint.trim().length > 0
          ? apiSubEndpoint.trim()
          : 'company'
      const result = await apiFetch(endpoint, {
        body: sanitizedBody,
        ...(method && { method }),
        headers: {
          'X-Garbo-Chunk': chunk,
        },
      })

      if (result === null) {
        throw new Error(`API endpoint not found: ${endpoint}`)
      }

      if (apiSubEndpoint === 'reporting-periods') {
        const registryPayload = pickRegistryPayloadFromReportingPeriodsSave(job)
        if (registryPayload) {
          try {
            await registryService.upsertReportInRegistry(registryPayload)
            await invalidateRegistryCache(registryCache, {
              warn: (msg: string, ...args: unknown[]) =>
                job.log([msg, ...args.map((a) => JSON.stringify(a))].join(' ')),
            })
          } catch (e: any) {
            job.log(`Registry upsert failed after save: ${e?.message ?? e}`)
          }
        }
      }

      return { success: true }
    } catch (error) {
      console.error('API Save error:', error)
      const errorMessage = `An error occurred during the save process: ${
        error.message || 'Unknown error'
      }`
      job.log(errorMessage)

      try {
        await job.sendMessage({
          content: `❌ Error: Something went wrong while processing ${
            job.data.apiSubEndpoint
          } for ${job.data.companyName}: ${error.message || 'Unknown error'}`,
        })
      } catch (msgError) {
        console.error('Failed to send error message:', msgError)
      }

      throw error
    }
  }
)

export default saveToAPI
