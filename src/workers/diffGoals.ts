import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, diffChanges } from '../lib/saveUtils'
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

  const { diff, requiresApproval } = await diffChanges({
    existingCompany,
    before: existingCompany?.goals,
    after: goals,
  })

  job.log('Diff:' + diff)

  await saveToAPI.queue.add(companyName + ' goals', {
    ...job.data,
    body,
    diff,
    requiresApproval,
    apiSubEndpoint: 'goals',

    // Remove duplicated job data that should be part of the body from now on
    goals: undefined,
  })

  return { body, diff, requiresApproval }
})

export default diffGoals
