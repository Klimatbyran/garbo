import { PipelineJob, PipelineWorker } from '../lib/PipelineWorker'
import { enqueueSaveToAPIWithParentFallback } from '../lib/DiffWorker'
import {
  chunkIdentifierWriteItems,
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

    const chunks = chunkIdentifierWriteItems(plan.items)
    job.log(
      `⚡ Enqueuing ${plan.items.length} GLEIF identifier write(s) for '${companyName}' in ${chunks.length} batch(es)`
    )

    for (const [index, chunk] of chunks.entries()) {
      const body = {
        items: chunk,
        verified: false,
        metadata: {
          source: 'gleif-lei-record',
          comment: job.data.lei
            ? `Mapped from LEI ${job.data.lei} via GLEIF (batch ${index + 1}/${chunks.length})`
            : `Mapped via GLEIF (batch ${index + 1}/${chunks.length})`,
        },
      }

      await enqueueSaveToAPIWithParentFallback(
        job,
        `${companyName} - GLEIF identifiers${chunks.length > 1 ? ` (${index + 1}/${chunks.length})` : ''}`,
        {
          ...job.data,
          body,
          diff: plan.reasons.join(' '),
          requiresApproval: false,
          apiSubEndpoint: 'identifiers/batch',
        }
      )
    }
  }
)

export default diffGleifIds
