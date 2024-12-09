import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, diffChanges } from '../lib/saveUtils'
import saveToAPI from './saveToAPI'

export class DiffInitiativesJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    existingCompany: any
    wikidata: { node: string }
    initiatives: any
  }
}

const diffInitiatives = new DiscordWorker<DiffInitiativesJob>(
  'diffInitiatives',
  async (job) => {
    const { url, companyName, existingCompany, initiatives } = job.data
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

    job.log('Diff:' + diff)

    await saveToAPI.queue.add(companyName + ' initiatives', {
      ...job.data,
      body,
      diff,
      requiresApproval,
      apiSubEndpoint: 'initiatives',

      // Remove duplicated job data that should be part of the body from now on
      initiatives: undefined,
    })

    return { body, diff, requiresApproval }
  }
)

export default diffInitiatives
