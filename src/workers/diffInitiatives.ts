import { changesInitiatives, changesRequireApproval } from '../lib/diffUtils'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, diffChanges } from '../lib/saveUtils'
import { QUEUE_NAMES } from '../queues'
import { Initiative } from '../types'
import saveToAPI from './saveToAPI'

export class DiffInitiativesJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    existingCompany: any
    wikidata: { node: string }
    initiatives: Initiative[]
  }
}

const diffInitiatives = new DiscordWorker<DiffInitiativesJob>(
  QUEUE_NAMES.DIFF_INITIATIVES,
  async (job) => {
    const { url, companyName, existingCompany, initiatives } = job.data
    const metadata = defaultMetadata(url)

    const body = {
      initiatives,
      metadata,
    }

    const changes = changesInitiatives(initiatives, existingCompany?.initiatives);

    const { diff, requiresApproval } = await diffChanges({
      existingCompany,
      before: existingCompany?.initiatives,
      after: initiatives,
    })

    job.log('Diff:' + diff)

    // Only save if we detected any meaningful changes
    if (changes.length > 0) {
      await saveToAPI.queue.add(companyName + ' initiatives', {
        ...job.data,
        body,
        diff,
        changes,
        requiresApproval: changesRequireApproval(changes),
        apiSubEndpoint: 'initiatives',

        // Remove duplicated job data that should be part of the body from now on
        initiatives: undefined,
      })
    }

    return { body, diff, requiresApproval }
  }
)

export default diffInitiatives
