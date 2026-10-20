import { PipelineJob, PipelineWorker } from '../lib/PipelineWorker'
import { enqueueSaveToAPIWithParentFallback } from '../lib/DiffWorker'
import { decideIsinWrite } from '../lib/isinOwnership'
import { normalizeIsin } from '../lib/normalizeIsin'
import { findCompanyByIsin } from '../lib/pipelineCompanyResolve'
import { QUEUE_NAMES } from '../queues'

export class DiffISINJob extends PipelineJob {
  declare data: PipelineJob['data'] & {
    companyName: string
    companyId: string
    lei?: string
    isin?: string
    candidates?: string[]
    existingCompany?: {
      identifiers?: Array<{ type: string; value: string }>
    }
  }
}

function existingIsinFromCompany(
  existingCompany?: DiffISINJob['data']['existingCompany']
): string | null {
  const row = existingCompany?.identifiers?.find(
    (identifier) => identifier.type === 'ISIN'
  )
  return normalizeIsin(row?.value)
}

const diffISIN = new PipelineWorker<DiffISINJob>(
  QUEUE_NAMES.DIFF_ISIN,
  async (job: DiffISINJob) => {
    const { companyName, companyId, isin, existingCompany } = job.data
    const normalizedIncoming = normalizeIsin(isin)
    const currentIsin = existingIsinFromCompany(existingCompany)

    job.log(
      `🔍 Comparing ISIN for '${companyName}':\nCurrent ISIN: '${currentIsin}'\nNew ISIN: '${isin}'`
    )

    if (!normalizedIncoming) {
      job.log(`❌ Incoming ISIN '${isin}' is invalid — not saving.`)
      return
    }

    const owner = await findCompanyByIsin(normalizedIncoming)
    const decision = decideIsinWrite({
      companyId,
      existingIsin: currentIsin,
      incomingIsin: normalizedIncoming,
      incomingIsinOwnerCompanyId: owner?.id,
    })

    if (decision.action === 'skip') {
      job.log(`✅ ${decision.reason}`)
      return
    }

    const body = {
      type: 'ISIN' as const,
      value: normalizedIncoming,
      verified: false,
      metadata: {
        source: 'gleif-lei-isins',
        comment: job.data.lei
          ? `Mapped from LEI ${job.data.lei} via GLEIF ISIN relationship API`
          : 'Mapped via GLEIF ISIN relationship API',
      },
    }

    job.log(
      `⚡ Detected ISIN for '${companyName}', enqueuing save operation...`
    )
    await enqueueSaveToAPIWithParentFallback(
      job,
      `${companyName} - ISIN Update`,
      {
        ...job.data,
        body,
        diff: decision.reason,
        requiresApproval: false,
        apiSubEndpoint: 'identifiers',
      }
    )

    job.log(
      `✅ Enqueued ISIN update for '${companyName}' with ISIN: '${normalizedIncoming}'.`
    )
  }
)

export default diffISIN
