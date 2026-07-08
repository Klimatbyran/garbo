import { PipelineJob, PipelineWorker } from '../lib/PipelineWorker'
import { enqueueSaveToAPIWithParentFallback } from '../lib/DiffWorker'
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

export function registryReportTypeChanged(
  existingReportTypeId: string | null,
  reportTypeId: string
): boolean {
  return existingReportTypeId !== reportTypeId
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

    if (!registryReportTypeChanged(existingReportTypeId, reportTypeId)) {
      job.log('Report type unchanged; skipping registry update')
      return { body, skipped: true }
    }

    const diff = `Report type: ${existingReportTypeId ?? 'none'} → ${reportTypeId}`
    job.log('Diff:' + diff)

    await enqueueSaveToAPIWithParentFallback(
      job,
      companyName + ' report type',
      {
        ...job.data,
        body,
        diff,
        requiresApproval: false,
        apiSubEndpoint: 'registry-report-type',
        reportTypeSlug: undefined,
      }
    )

    return { body, diff, requiresApproval: false }
  }
)

export default diffReportType
