import { ChangeDescription } from '../lib/diffUtils'
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
    const { url, companyName, existingCompany, goals, autoApprove } = job.data
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

  const change: ChangeDescription = {
    type: 'goals',
    oldValue: { goals: existingCompany.goals },
    newValue: { goals: goals },
  }

  job.requestApproval('goals', change, autoApprove || !requiresApproval, metadata, `Updates to the company's goals`);

  job.log('Diff:' + diff)

  // Only save if we detected any meaningful changes
  if (diff) {
    await saveToAPI.queue.add(companyName + ' goals', {
      ...job.data,
      body,
      diff,
      apiSubEndpoint: 'goals',

      // Remove duplicated job data that should be part of the body from now on
      goals: undefined,
    })
  }

  return { body, diff, requiresApproval }
})

export default diffGoals
