import { changesGoals, changesRequireApproval } from '../lib/diffUtils'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, diffChanges } from '../lib/saveUtils'
import { QUEUE_NAMES } from '../queues'
import { Goal } from '../types'
import saveToAPI from './saveToAPI'

export class DiffGoalsJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    existingCompany: any
    wikidata: { node: string }
    goals: Goal[]
  }
}

const diffGoals = new DiscordWorker<DiffGoalsJob>(
  QUEUE_NAMES.DIFF_GOALS,
  async (job) => {
    const { url, companyName, existingCompany, goals } = job.data
    const metadata = defaultMetadata(url)

  const body = {
    goals,
    metadata,
  }

  const changes = changesGoals(goals, existingCompany?.goals);

  const { diff, requiresApproval } = await diffChanges({
    existingCompany,
    before: existingCompany?.goals,
    after: goals,
  })

  job.log('Diff:' + diff)

  // Only save if we detected any meaningful changes
  if (changes.length > 0) {
    await saveToAPI.queue.add(companyName + ' goals', {
      ...job.data,
      body,
      diff,
      requiresApproval: changesRequireApproval(changes),
      apiSubEndpoint: 'goals',

      // Remove duplicated job data that should be part of the body from now on
      goals: undefined,
    })
  }

  return { body, diff, requiresApproval }
})

export default diffGoals
