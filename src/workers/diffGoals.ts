import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, askDiff } from '../lib/saveUtils'
import saveToAPI from './saveToAPI'

export class DiffGoalsJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    existingCompany: any
    wikidata: { node: string }
    goals: any
  }
}

const diffGoals = new DiscordWorker<DiffGoalsJob>('diffGoals', async (job) => {
  const { url, companyName, existingCompany, goals } = job.data
  const metadata = defaultMetadata(url)

  const body = {
    goals,
    metadata,
  }

  const diff = await askDiff(existingCompany?.goals, goals)
  const requiresApproval = diff && !diff.includes('NO_CHANGES')

  await saveToAPI.queue.add(companyName + ' goals', {
    ...job.data,
    body,
    diff,
    apiSubEndpoint: 'goals',
    requiresApproval: Boolean(existingCompany),

    // Remove duplicated job data that should be part of the body from now on
    goals: undefined,
  })

  return { body, diff, requiresApproval }
})

export default diffGoals
