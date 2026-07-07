import { FlowProducer } from 'bullmq'
import { PipelineJob, PipelineWorker } from '../lib/PipelineWorker'
import { apiFetch } from '../lib/api'
import redis from '../config/redis'
import { getCompanyURL } from '../lib/saveUtils'
import { QUEUE_NAMES } from '../queues'
import {
  extractScopeEntriesFromFollowUp,
  mergeScope1AndScope2Results,
} from '../lib/mergeScopeResults'
import { buildEarlyRegistryPayload } from './saveToAPI.utils'
import { registryService } from '../api/services/registryService'
import { companyReportService } from '../api/services/companyReportService'
import {
  companyMutationPath,
  pipelineCompanyReadPath,
} from '../lib/pipelineCompanyPath'

export class CheckDBJob extends PipelineJob {
  declare data: PipelineJob['data'] & {
    companyName: string
    companyId: string
    /** Original report URL when pipeline cached PDF to S3 (parsePdf). */
    sourceUrl?: string
    /** Cached/uploaded PDF storage metadata from pipeline-api (when available). */
    pdfCache?: {
      publicUrl?: string
      sha256?: string
    }
    /** PDF year from pipeline parse when set on the job. */
    documentReportYear?: string | number
    /** Registry report id from early upsert in this worker (passed to diff/save children). */
    registryReportId?: string
    wikidata?: { node: string }
    fiscalYear: {
      startMonth: number
      endMonth: number
    }
    approved?: boolean
    lei?: string
    replaceAllEmissions?: boolean
    tags?: string[]
  }
}

const flow = new FlowProducer({ connection: redis })
flow.on('error', (err) => console.error('FlowProducer connection error:', err))

const checkDB = new PipelineWorker(
  QUEUE_NAMES.CHECK_DB,
  async (job: CheckDBJob) => {
    const { companyName, companyId, url, sourceUrl, fiscalYear, wikidata } =
      job.data

    const childrenEntries = await job.getChildrenEntries()

    const extractValue = (entry: any) =>
      entry && typeof entry === 'object' && 'value' in entry
        ? entry.value
        : entry

    const root = extractValue(childrenEntries) // <- this is the object that has scope data, economy, etc.

    const {
      scope12: legacyScope12,
      scope1,
      scope2,
      scope3,
      biogenic,
      industry,
      economy,
      baseYear,
      goals,
      initiatives,
      descriptions,
      lei,
      tags: extractedTags,
    } = root || {}

    // User-provided tags are a starting point; merge with AI-extracted tags when available.
    const userTags = Array.isArray(job.data.tags) ? job.data.tags : []
    const aiTags = Array.isArray(extractedTags) ? extractedTags : []
    const tags = Array.from(new Set([...userTags, ...aiTags])).filter(
      (t) => typeof t === 'string' && t.trim().length > 0
    )

    const mergedScope12 = mergeScope1AndScope2Results(
      extractScopeEntriesFromFollowUp(scope1),
      extractScopeEntriesFromFollowUp(scope2),
      extractScopeEntriesFromFollowUp(legacyScope12)
    )

    job.sendMessage(`🤖 Checking if ${companyName} already exists in API...`)
    const existingCompany = await apiFetch(
      pipelineCompanyReadPath(companyId)
    ).catch(() => null)
    job.log(existingCompany)

    if (!existingCompany) {
      job.log(
        `Company ${companyId} not returned from pipeline read; syncing name (should exist from precheck)`
      )
      const synced = await apiFetch(companyMutationPath(companyId), {
        body: { name: companyName },
      })
      if (synced === null) {
        throw new Error(
          `Company ${companyId} not found after precheck resolution — cannot continue pipeline`
        )
      }
      await job.sendMessage(
        `✅ Synced company '${companyName}' (${companyId}). See: ${getCompanyURL(companyName, companyId, wikidata?.node)}`
      )
    } else {
      job.log(`✅ The company '${companyName}' was found in the database.`)
      const leiLabel = existingCompany.lei ?? 'none'
      await job.sendMessage(
        `✅ The company '${companyName}' was found in the database, with LEI number '${leiLabel}'`
      )
    }

    // TODO(pipeline): Registry upsert and CompanyReport shell creation moved to checkDB;
    // registryReportId is carried on the job through diff/save. Period save still re-resolves
    // the shell and may reassign periods (ensureCompanyReportRegistryLink). Consider making
    // registryReportId the single source of truth for the run instead of re-inferring at save.
    let registryReportId: string | undefined
    let companyReportId: string | undefined
    const earlyRegistryPayload = buildEarlyRegistryPayload({
      companyName,
      wikidata,
      url,
      sourceUrl,
      pdfCache: job.data.pdfCache,
      documentReportYear: job.data.documentReportYear,
    })
    if (earlyRegistryPayload) {
      try {
        const report =
          await registryService.upsertReportInRegistry(earlyRegistryPayload)
        registryReportId = report.id
        companyReportId = await companyReportService.findOrCreateCompanyReport(
          companyId,
          report.id
        )
        job.log(`Early registry upsert: ${report.id}`)
      } catch (error: any) {
        job.log(
          `Early registry upsert failed: ${error?.message ?? String(error)}`
        )
      }
    } else {
      job.log(
        'Skipping early registry upsert: no PDF URL identity on job (url/sourceUrl/pdfCache)'
      )
    }

    const base = {
      name: companyName,
      data: {
        ...job.data,
        existingCompany,
        companyName,
        companyId,
        url,
        sourceUrl,
        fiscalYear,
        wikidata,
        autoApprove: job.data.autoApprove,
        replaceAllEmissions: job.data.replaceAllEmissions,
        batchId: job.data.batchId,
        pdfCache: job.data.pdfCache,
        documentReportYear: job.data.documentReportYear,
        ...(registryReportId && { registryReportId }),
        ...(companyReportId && { companyReportId }),
      },
      opts: {
        attempts: 3,
      },
    }

    await job.editMessage(`🤖 Saving data...`)

    await flow.add({
      ...base,
      queueName: QUEUE_NAMES.SEND_COMPANY_LINK,
      data: {
        ...base.data,
      },
      children: [
        mergedScope12 || scope3 || biogenic || economy
          ? {
              ...base,
              queueName: QUEUE_NAMES.DIFF_REPORTING_PERIODS,
              data: {
                ...base.data,
                scope12: mergedScope12,
                scope3,
                biogenic,
                economy,
              },
            }
          : null,
        industry
          ? {
              ...base,
              queueName: QUEUE_NAMES.DIFF_INDUSTRY,
              data: {
                ...base.data,
                industry,
              },
            }
          : null,
        goals
          ? {
              ...base,
              queueName: QUEUE_NAMES.DIFF_GOALS,
              data: {
                ...base.data,
                goals,
              },
            }
          : null,
        baseYear
          ? {
              ...base,
              queueName: QUEUE_NAMES.DIFF_BASE_YEAR,
              data: {
                ...base.data,
                baseYear,
              },
            }
          : null,
        initiatives
          ? {
              ...base,
              queueName: QUEUE_NAMES.DIFF_INITIATIVES,
              data: {
                ...base.data,
                initiatives,
              },
            }
          : null,
        lei
          ? {
              ...base,
              queueName: QUEUE_NAMES.DIFF_LEI,
              data: {
                ...base.data,
                lei,
              },
            }
          : null,
        descriptions
          ? {
              name: 'diffDescriptions' + companyName,
              queueName: QUEUE_NAMES.DIFF_DESCRIPTIONS,
              data: {
                ...job.data,
                fiscalYear: undefined,
                companyId,
                existingDescriptions: existingCompany?.descriptions,
                descriptions: descriptions,
              },
            }
          : null,
        tags?.length
          ? {
              ...base,
              queueName: QUEUE_NAMES.DIFF_TAGS,
              data: {
                ...base.data,
                tags,
              },
            }
          : null,
      ].filter((e) => e !== null),
    })

    return { saved: true }
  }
)

export default checkDB
