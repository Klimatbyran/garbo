import { QUEUE_NAMES } from '../queues'
import { DiffJob, DiffWorker } from '../lib/DiffWorker'

type FragmentedValuesReporting =
  | 'NONE'
  | 'PARTS_WITH_TOTAL'
  | 'PARTS_ONLY_NO_TOTAL'
  | null

type Scope3CategoryFragmentation = {
  category: number
  fragmentedReporting: 'PARTS_WITH_TOTAL' | 'PARTS_ONLY_NO_TOTAL'
  example: string
}

export class DiffReportingQualityJob extends DiffJob {
  declare data: DiffJob['data'] & {
    companyName: string
    reportingQuality: {
      usesGhgProtocolCategories:
        | 'FULL'
        | 'GROUPED'
        | 'CUSTOM_LABELS'
        | 'SINGLE_TOTAL'
        | null
      categoryLabelsExample: string | null
      methodChanges: { year: number | null; description: string }[]
      missingScopesExplained: boolean | null
      missingScopesReason: string | null
      scope2MethodExplicit: boolean | null
      scope1FragmentedReporting: FragmentedValuesReporting
      scope1FragmentedExample: string | null
      scope2FragmentedReporting: FragmentedValuesReporting
      scope2FragmentedExample: string | null
      scope3CategoryFragmentation: Scope3CategoryFragmentation[]
    }
  }
}

// No approval step — reporting quality flags are derived metadata, not user-facing claims.
const diffReportingQuality = new DiffWorker<DiffReportingQualityJob>(
  QUEUE_NAMES.DIFF_REPORTING_QUALITY,
  async (job) => {
    const { companyName, url, reportingQuality } = job.data

    await job.enqueueSaveToAPI('reporting-quality', companyName, {
      url,
      usesGhgProtocolCategories: reportingQuality.usesGhgProtocolCategories,
      categoryLabelsExample: reportingQuality.categoryLabelsExample,
      methodChanges: reportingQuality.methodChanges,
      missingScopesExplained: reportingQuality.missingScopesExplained,
      missingScopesReason: reportingQuality.missingScopesReason,
      scope2MethodExplicit: reportingQuality.scope2MethodExplicit,
      scope1FragmentedReporting: reportingQuality.scope1FragmentedReporting,
      scope1FragmentedExample: reportingQuality.scope1FragmentedExample,
      scope2FragmentedReporting: reportingQuality.scope2FragmentedReporting,
      scope2FragmentedExample: reportingQuality.scope2FragmentedExample,
      scope3CategoryFragmentation: reportingQuality.scope3CategoryFragmentation,
    })
  }
)

export default diffReportingQuality
