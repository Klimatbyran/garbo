import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, askDiff } from '../lib/saveUtils'
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

    const diff = await askDiff(existingCompany?.initiatives, initiatives)
    const requiresApproval = diff && !diff.includes('NO_CHANGES')

    await saveToAPI.queue.add(companyName + ' initiatives', {
      ...job.data,
      body,
      diff,
      apiSubEndpoint: 'initiatives',
      requiresApproval: Boolean(existingCompany),

      // Remove duplicated job data that should be part of the body from now on
      initiatives: undefined,
    })

    return { body, diff, requiresApproval }
  }
)

export default diffInitiatives
