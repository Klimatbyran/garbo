import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, askDiff } from '../lib/saveUtils'
import saveToAPI from './saveToAPI'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    existingCompany: any
    wikidata: any
    goals: any
  }
}

const diffGoals = new DiscordWorker<JobData>('diffGoals', async (job) => {
  const { url, wikidata, companyName, existingCompany, goals } = job.data
  const wikidataId = wikidata.node
  const metadata = defaultMetadata(url)

  const body = {
    goals,
    metadata,
  }

  const diff = await askDiff(existingCompany?.goals, goals)
  const requiresApproval = diff && !diff.includes('NO_CHANGES')

  await saveToAPI.queue.add(companyName, {
    data: {
      ...job.data,
      body,
      diff,
      requiresApproval,
      wikidataId,
    },
  })

  return { body, diff, requiresApproval }
})

export default diffGoals
