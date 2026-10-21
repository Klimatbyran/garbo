import { PipelineJob, PipelineWorker } from '../lib/PipelineWorker'
import { enqueueSaveToAPIWithParentFallback } from '../lib/DiffWorker'
import {
  planGleifIdentifierWrites,
  type ExistingIdentifier,
} from '../lib/gleifIdentifierWrite'
import type { GleifLeiLinkedIdentifiers } from '../lib/gleif'
import { QUEUE_NAMES } from '../queues'

export class DiffGleifIdsJob extends PipelineJob {
  declare data: PipelineJob['data'] & {
    companyName: string
    companyId: string
    lei?: string
    linked?: GleifLeiLinkedIdentifiers | null
    existingCompany?: {
      identifiers?: Array<{ type: string; value: string; role?: string | null }>
    }
  }
}

const diffGleifIds = new PipelineWorker<DiffGleifIdsJob>(
  QUEUE_NAMES.DIFF_GLEIF_IDS,
  async (job: DiffGleifIdsJob) => {
    const { companyName, companyId, linked, existingCompany } = job.data
    if (!linked) {
      job.log('No GLEIF-linked payload; nothing to write.')
      return
    }

    const existing: ExistingIdentifier[] = (
      existingCompany?.identifiers ?? []
    ).map((row) => ({
      type: row.type,
      value: row.value,
      role: row.role,
    }))

    const plan = planGleifIdentifierWrites({
      existing,
      isins: linked.isins,
      isinTotal: linked.isinTotal,
      isinsTruncated: linked.isinsTruncated,
      registeredAs: linked.registeredAs,
      bics: linked.bics,
    })

    for (const reason of plan.reasons) {
      job.log(reason)
    }

    if (plan.items.length === 0) {
      job.log(`No identifier writes for '${companyName}'.`)
      return
    }

    const body = {
      items: plan.items,
      verified: false,
      metadata: {
        source: 'gleif-lei-record',
        comment: job.data.lei
          ? `Mapped from LEI ${job.data.lei} via GLEIF`
          : 'Mapped via GLEIF',
      },
    }

    job.log(
      `⚡ Enqueuing ${plan.items.length} GLEIF identifier write(s) for '${companyName}'`
    )
    await enqueueSaveToAPIWithParentFallback(
      job,
      `${companyName} - GLEIF identifiers`,
      {
        ...job.data,
        body,
        diff: plan.reasons.join(' '),
        requiresApproval: false,
        apiSubEndpoint: 'identifiers/batch',
      }
    )
  }
)

export default diffGleifIds
