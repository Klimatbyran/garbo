import { PipelineJob, PipelineWorker } from '../lib/PipelineWorker'
import { enqueueSaveToAPIWithParentFallback } from '../lib/DiffWorker'
import { diffChanges } from '../lib/saveUtils'
import { QUEUE_NAMES } from '../queues'
import { apiFetch } from '../lib/api'

export class DiffReportTypeJob extends PipelineJob {
  declare data: PipelineJob['data'] & {
    companyName: string
    registryReportId: string
    existingReportTypeId: string | null
    reportTypeSlug: string
  }
}

async function resolveReportTypeId(slug: string): Promise<string | null> {
  const options = await apiFetch('/report-types')
  if (!Array.isArray(options)) return null
  const match = options.find(
    (option: { id?: string; slug?: string }) => option.slug === slug
  )
  return match?.id ?? null
}

const diffReportType = new PipelineWorker<DiffReportTypeJob>(
  QUEUE_NAMES.DIFF_REPORT_TYPE,
  async (job) => {
    const {
      companyName,
      registryReportId,
      existingReportTypeId,
      reportTypeSlug,
    } = job.data

    const reportTypeId = await resolveReportTypeId(reportTypeSlug)
    if (!reportTypeId) {
      job.log(`Unknown report type slug: ${reportTypeSlug}`)
      return { skipped: true }
    }

    const body = {
      id: registryReportId,
      reportTypeId,
    }

    const { diff, requiresApproval } = await diffChanges({
      existingCompany: existingReportTypeId ? { id: registryReportId } : null,
      before: { reportTypeId: existingReportTypeId },
      after: { reportTypeId },
    })

    job.log('Diff:' + diff)

    if (diff) {
      await enqueueSaveToAPIWithParentFallback(
        job,
        companyName + ' report type',
        {
          ...job.data,
          body,
          diff,
          requiresApproval,
          apiSubEndpoint: 'registry-report-type',
          reportTypeSlug: undefined,
        }
      )
    }

    return { body, diff, requiresApproval }
  }
)

export default diffReportType
