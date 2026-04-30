import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { enqueueSaveToAPIWithParentFallback } from '../lib/DiffWorker'
import wikidata from '../prompts/wikidata'
import { QUEUE_NAMES } from '../queues'

export class DiffLEIJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    lei?: string | undefined // Switching to lei
    existingCompany: any
    wikidata: { node: string }
  }
}

function compareLei(
  existingLei?: string,
  lei?: string
): {
  shouldUpdate: boolean
  reason: string
} {
  if (!existingLei || existingLei.trim() === '') {
    return {
      shouldUpdate: true,

      reason: `No existing LEI. New LEI '${lei}' will be set.`,
    }
  }

  if (existingLei === lei) {
    return {
      shouldUpdate: false,
      reason: `Current LEI '${existingLei}' is already correct. No changes needed.`,
    }
  }

  return {
    shouldUpdate: true,
    reason: `Current LEI '${existingLei}' differs from New LEI '${lei}'. An update is required.`,
  }
}

const diffLEI = new DiscordWorker<DiffLEIJob>(
  QUEUE_NAMES.DIFF_LEI,
  async (job: DiffLEIJob) => {
    const { companyName, lei, existingCompany } = job.data

    const currentLei = existingCompany?.lei

    job.log(
      `🔍 Comparing LEI for '${companyName}': \nCurrent LEI: '${currentLei}'\nNew LEI: '${lei}'`
    )

    const comparisonResult = compareLei(currentLei, lei)

    if (!comparisonResult.shouldUpdate) {
      job.log(
        `✅ No changes detected for '${companyName}'. Current LEI is already correct.`
      )
      return
    }

    const body = {
      lei: lei,
      wikidataId: job.data.wikidata.node,
      name: companyName,
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
        diff: comparisonResult.reason,
        requiresApproval: false,
        apiSubEndpoint: '',
      }
    )

    job.log(`✅ Enqueued LEI update for '${companyName}' with LEI: '${lei}'.`)
  }
)

export default diffLEI
