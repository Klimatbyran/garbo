import { ChangeDescription } from '../lib/diffUtils'
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
    const { url, companyName, existingCompany, initiatives, autoApprove } = job.data
    const metadata = defaultMetadata(url)

    const body = {
      initiatives,
      metadata,
    }

    const { diff, requiresApproval } = await diffChanges({
      existingCompany,
      before: existingCompany?.initiatives,
      after: initiatives,
    })

    const change: ChangeDescription = {
        type: 'initiatives',
        oldValue: { initiatives: existingCompany.initiatives },
        newValue: { initiatives: initiatives },
      }
    
    job.requestApproval('initiatives', change, autoApprove || !requiresApproval, metadata, `Updates to the company's initiatives`);
    job.log('Diff:' + diff)

    // Only save if we detected any meaningful changes
    if (diff) {
      await saveToAPI.queue.add(companyName + ' initiatives', {
        ...job.data,
        body,
        diff,
        apiSubEndpoint: 'initiatives',

        // Remove duplicated job data that should be part of the body from now on
        initiatives: undefined,
      })
    }

    return { body, diff, requiresApproval }
  }
)

export default diffInitiatives
