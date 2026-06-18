import { canonicalPublicReportUrl, diffChanges } from '../lib/saveUtils'
import { getReportingPeriodDates } from '../lib/reportingPeriodDates'
import { resolveDocumentReportYear } from './saveToAPI.utils'
import { QUEUE_NAMES } from '../queues'
import { ChangeDescription, DiffWorker, DiffJob } from '../lib/DiffWorker'
import apiConfig from '../config/api'
import { apiFetch } from '../lib/api'
import {
  buildPipelineReportIdentity,
  buildReportingPeriodsApiBodyExtras,
  isReportIdentityKnownInCompany,
  reportingPeriodsForReportIdentity,
} from '../lib/reportSaveIdentity'

export class DiffReportingPeriodsJob extends DiffJob {
  declare data: DiffJob['data'] & {
    companyName: string
    /** Original report URL when pipeline cached PDF to S3 (parsePdf). */
    sourceUrl?: string
    /** Cached/uploaded PDF storage metadata from pipeline-api (when available). */
    pdfCache?: {
      publicUrl?: string
      sha256?: string
    }
    existingCompany: any
    wikidata: { node: string }
    fiscalYear: any
    scope12?: any[]
    scope3?: any[]
    biogenic?: any[]
    economy?: any[]
    totalEmissions?: any[]
    replaceAllEmissions?: boolean
    /** PDF year from pipeline parse when set on the job. */
    documentReportYear?: string | number
  }
}

async function fetchFreshExistingCompany(wikidataId: string) {
  return apiFetch(`/pipeline/companies/${wikidataId}`).catch(() => null)
}

const diffReportingPeriods = new DiffWorker<DiffReportingPeriodsJob>(
  QUEUE_NAMES.DIFF_REPORTING_PERIODS,
  async (job) => {
    const {
      url,
      sourceUrl,
      pdfCache,
      wikidata,
      fiscalYear,
      companyName,
      existingCompany: existingCompanyFromCheckDb,
    } = job.data

    const reportURLForPeriod = canonicalPublicReportUrl({ url, sourceUrl })
    const trimmedUrl = typeof url === 'string' ? url.trim() : ''
    const trimmedSourceUrl =
      typeof sourceUrl === 'string' ? sourceUrl.trim() : undefined
    const sourceIsHttp =
      typeof trimmedSourceUrl === 'string' &&
      /^https?:\/\//i.test(trimmedSourceUrl)

    const reportS3UrlForPeriod =
      (typeof pdfCache?.publicUrl === 'string' && pdfCache.publicUrl.trim()) ||
      (trimmedUrl && (!sourceIsHttp || trimmedUrl !== trimmedSourceUrl)
        ? trimmedUrl
        : undefined)

    if (job.isDataApproved()) {
      const approvedBody = job.getApprovedBody() ?? {}
      const periods = approvedBody.reportingPeriods ?? []
      const documentReportYear = resolveDocumentReportYear(periods, {
        documentReportYear:
          approvedBody.documentReportYear ?? job.data.documentReportYear,
        reportUrl: reportURLForPeriod,
        sourceUrl: trimmedSourceUrl,
      })

      await job.enqueueSaveToAPI('reporting-periods', companyName, wikidata, {
        ...approvedBody,
        ...(job.data.replaceAllEmissions && { replaceAllEmissions: true }),
        documentReportYear,
        reportUrl: reportURLForPeriod,
        reportSourceUrl: trimmedSourceUrl,
        reportS3Url: reportS3UrlForPeriod,
        reportSha256: pdfCache?.sha256,
      })
      return
    }

    if (!job.hasApproval()) {
      const wikidataId = wikidata.node
      const freshCompany =
        (await fetchFreshExistingCompany(wikidataId)) ??
        existingCompanyFromCheckDb
      const reportIdentity = buildPipelineReportIdentity(job.data)
      const isNewReportIdentity = !isReportIdentityKnownInCompany(
        freshCompany,
        reportIdentity
      )

      if (isNewReportIdentity) {
        job.log(
          `New report identity for ${wikidataId}: ${reportIdentity.reportURL}`
        )
      }

      const years = new Set([
        ...(job.data.scope12?.map((d) => d.year) ?? []),
        ...(job.data.scope3?.map((d) => d.year) ?? []),
        ...(job.data.biogenic?.map((d) => d.year) ?? []),
        ...(job.data.economy?.map((d) => d.year) ?? []),
        ...(job.data.totalEmissions?.map((d) => d.year) ?? []),
      ])

      const reportYear = years.size > 0 ? Math.max(...Array.from(years)) : null

      const scope12 = job.data.scope12 ?? []
      const scope3 = job.data.scope3 ?? []
      const biogenic = job.data.biogenic ?? []
      const economy = job.data.economy ?? []
      const totalEmissions = job.data.totalEmissions ?? []

      const reportingPeriods = Array.from(years).map((year) => {
        const [startDate, endDate] = getReportingPeriodDates(
          year,
          fiscalYear.startMonth,
          fiscalYear.endMonth
        )
        return {
          year,
          startDate,
          endDate,
          reportURL:
            reportYear !== null && year === reportYear
              ? reportURLForPeriod
              : undefined,
          reportS3Url:
            reportYear !== null && year === reportYear
              ? reportS3UrlForPeriod
              : undefined,
          reportSha256:
            reportYear !== null && year === reportYear
              ? pdfCache?.sha256
              : undefined,
        }
      })

      const updatedReportingPeriods = reportingPeriods.map(
        ({ year, ...period }) => {
          const emissions = {
            scope1: scope12.find((d) => d.year === year)?.scope1,
            scope2: scope12.find((d) => d.year === year)?.scope2,
            scope1And2: scope12.find((d) => d.year === year)?.scope1And2,
            scope3: scope3.find((d) => d.year === year)?.scope3,
            biogenic: biogenic.find((d) => d.year === year)?.biogenic,
            statedTotalEmissions: totalEmissions.find((d) => d.year === year)
              ?.statedTotalEmissions,
          }

          const economyData =
            economy.find((d) => d.year === year)?.economy ?? {}

          const reportingPeriod: any = period

          if (Object.values(emissions).some((value) => value !== undefined)) {
            reportingPeriod.emissions = emissions
          }

          if (Object.values(economyData).some((value) => value !== undefined)) {
            reportingPeriod.economy = economyData
          }

          if (reportYear !== null && year !== reportYear) {
            const existingPeriod = freshCompany?.reportingPeriods?.find(
              (rp: any) => rp.year === year.toString()
            )
            if (existingPeriod?.reportURL) {
              reportingPeriod.reportURL = existingPeriod.reportURL
            }
            if (existingPeriod?.reportS3Url) {
              reportingPeriod.reportS3Url = existingPeriod.reportS3Url
            }
            if (existingPeriod?.reportSha256) {
              reportingPeriod.reportSha256 = existingPeriod.reportSha256
            }
          }

          return reportingPeriod
        }
      )

      const periodsBefore = reportingPeriodsForReportIdentity(
        freshCompany,
        reportIdentity
      )

      const { diff, requiresApproval } = await diffChanges({
        existingCompany: freshCompany,
        before: periodsBefore,
        after: updatedReportingPeriods,
      })

      const change: ChangeDescription = {
        type: 'reportingPeriods',
        oldValue: {
          reportingPeriods: periodsBefore,
        },
        newValue: { reportingPeriods: updatedReportingPeriods },
      }

      const saveBodyExtras = buildReportingPeriodsApiBodyExtras(
        job.data,
        updatedReportingPeriods
      )

      const forceSave =
        isNewReportIdentity && updatedReportingPeriods.length > 0

      await job.handleDiff(
        'reporting-periods',
        diff,
        change,
        typeof requiresApproval == 'boolean' ? requiresApproval : false,
        { forceSave, saveBodyExtras }
      )
    }

    if (job.hasApproval() && !job.isDataApproved()) {
      await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
    }
  }
)

export default diffReportingPeriods
