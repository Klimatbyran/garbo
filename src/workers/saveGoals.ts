import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, askDiff } from '../lib/saveUtils'
import saveToAPI from './saveToAPI'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidata: any
    goals?: any
  }
}

const saveGoals = new DiscordWorker<JobData>('saveGoals', async (job) => {
  const { url, wikidata, companyName, goals } = job.data
  const wikidataId = wikidata.node
  const metadata = defaultMetadata(url)

  if (goals) {
    const body = {
      goals,
      metadata,
    }

    const diff = await askDiff(null, { goals })
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

export default saveGoals
