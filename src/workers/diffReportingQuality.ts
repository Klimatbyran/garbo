import { QUEUE_NAMES } from '../queues'
import { DiffJob, DiffWorker } from '../lib/DiffWorker'

export class DiffReportingQualityJob extends DiffJob {
  declare data: DiffJob['data'] & {
    companyName: string
    wikidata: { node: string }
    reportingQuality: {
      usesGhgProtocolCategories: boolean | null
      methodChanges: { year: number | null; description: string }[]
      missingScopesExplained: boolean | null
    }
  }
}

// No approval step — reporting quality flags are derived metadata, not user-facing claims.
const diffReportingQuality = new DiffWorker<DiffReportingQualityJob>(
  QUEUE_NAMES.DIFF_REPORTING_QUALITY,
  async (job) => {
    const { wikidata, companyName, url, reportingQuality } = job.data

    await job.enqueueSaveToAPI('reporting-quality', companyName, wikidata, {
      url,
      usesGhgProtocolCategories: reportingQuality.usesGhgProtocolCategories,
      methodChanges: reportingQuality.methodChanges,
      missingScopesExplained: reportingQuality.missingScopesExplained,
    })
  }
)

export default diffReportingQuality
