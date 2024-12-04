import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, askDiff } from '../lib/saveUtils'
import saveToAPI from './saveToAPI'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidata: any
    initiatives?: any
  }
}

const saveInitiatives = new DiscordWorker<JobData>('saveInitiatives', async (job) => {
  const { url, wikidata, companyName, initiatives } = job.data
  const wikidataId = wikidata.node
  const metadata = defaultMetadata(url)

  if (initiatives) {
    const body = {
      initiatives,
      metadata,
    }

    const diff = await askDiff(null, { initiatives })
    const requiresApproval = diff && !diff.includes('NO_CHANGES')

    await saveToAPI.queue.add(companyName, {
      ...job.data,
      data: {
        body,
        diff,
        requiresApproval,
        wikidataId,
      },
    })

    return { body, diff, requiresApproval }
  }

  return null
})

export default saveInitiatives
