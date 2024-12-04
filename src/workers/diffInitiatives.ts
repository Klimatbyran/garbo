import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, askDiff } from '../lib/saveUtils'
import saveToAPI from './saveToAPI'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    existingCompany: any
    wikidata: any
    initiatives: any
  }
}

const diffInitiatives = new DiscordWorker<JobData>(
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

    await saveToAPI.queue.add(companyName, {
      data: {
        ...job.data,
        body,
        diff,
        requiresApproval,
      },
    })

    return { body, diff, requiresApproval }
  }
)

export default diffInitiatives
