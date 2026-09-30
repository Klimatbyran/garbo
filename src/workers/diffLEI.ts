import { PipelineJob, PipelineWorker } from '../lib/PipelineWorker'
import { enqueueSaveToAPIWithParentFallback } from '../lib/DiffWorker'
import { preferRicherDiacriticCompanyName } from '../lib/companyLinkResolve'
import { decideLeiWrite } from '../lib/leiOwnership'
import { findCompanyByLei } from '../lib/pipelineCompanyResolve'
import { normalizeLei } from '../lib/normalizeLei'
import { QUEUE_NAMES } from '../queues'

export class DiffLEIJob extends PipelineJob {
  declare data: PipelineJob['data'] & {
    companyName: string
    companyId: string
    lei?: string | undefined
    existingCompany: any
    wikidata?: { node: string }
  }
}

const diffLEI = new PipelineWorker<DiffLEIJob>(
  QUEUE_NAMES.DIFF_LEI,
  async (job: DiffLEIJob) => {
    const { companyName, lei, existingCompany, companyId } = job.data

    const currentLei = existingCompany?.lei
    const normalizedIncoming = normalizeLei(lei)

    job.log(
      `🔍 Comparing LEI for '${companyName}': \nCurrent LEI: '${currentLei}'\nNew LEI: '${lei}'`
    )

    if (!normalizedIncoming) {
      job.log(`❌ Incoming LEI '${lei}' is invalid — not saving.`)
      return
    }

    const owner = await findCompanyByLei(normalizedIncoming)
    const decision = decideLeiWrite({
      companyId,
      existingLei: currentLei,
      incomingLei: normalizedIncoming,
      incomingLeiOwnerCompanyId: owner?.id,
    })

    if (decision.action === 'skip') {
      job.log(`✅ ${decision.reason}`)
      return
    }

    const name = preferRicherDiacriticCompanyName(
      existingCompany?.name,
      companyName
    )

    const body = {
      lei: normalizedIncoming,
      name,
      ...(job.data.wikidata?.node && { wikidataId: job.data.wikidata.node }),
    }

    job.log(
      `⚡ Detected changes for '${companyName}', enqueuing save operation...`
    )
    await enqueueSaveToAPIWithParentFallback(
      job,
      `${companyName} - LEI Update`,
      {
        ...job.data,
        body: body,
        diff: decision.reason,
        requiresApproval: false,
        apiSubEndpoint: '',
      }
    )

    job.log(
      `✅ Enqueued LEI update for '${companyName}' with LEI: '${normalizedIncoming}'.`
    )
  }
)

export default diffLEI
