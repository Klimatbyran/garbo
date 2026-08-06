import apiConfig from '../config/api'
import {
  ChangeDescription,
  DiffJob,
  DiffWorker,
  isApprovedForDiffType,
  isPendingApprovalForDiffType,
  shouldRunDiffComputation,
} from '../lib/DiffWorker'
import { diffChanges } from '../lib/saveUtils'
import { QUEUE_NAMES } from '../queues'
import { Goal } from '../types'

export class DiffGoalsJob extends DiffJob {
  declare data: DiffJob['data'] & {
    companyName: string
    existingCompany: any
    wikidata: { node: string }
    goals: Goal[]
  }
}

const GOALS_ENDPOINT = 'goals'

const diffGoals = new DiffWorker<DiffGoalsJob>(
  QUEUE_NAMES.DIFF_GOALS,
  async (job) => {
    const { wikidata, companyName, existingCompany, goals } = job.data
    if (isApprovedForDiffType(job, GOALS_ENDPOINT)) {
      await job.enqueueSaveToAPI(
        GOALS_ENDPOINT,
        companyName,
        job.getApprovedBody()
      )
      return
    }

    if (shouldRunDiffComputation(job, GOALS_ENDPOINT)) {
      const { diff, requiresApproval } = await diffChanges({
        existingCompany,
        before: existingCompany?.goals,
        after: goals,
      })

      const previousGoals = existingCompany?.goals ?? []

      const change: ChangeDescription = {
        type: 'goals',
        oldValue: { goals: previousGoals },
        newValue: { goals },
      }

      await job.handleDiff(
        GOALS_ENDPOINT,
        diff,
        change,
        typeof requiresApproval == 'boolean' ? requiresApproval : false
      )
    }

    if (isPendingApprovalForDiffType(job, GOALS_ENDPOINT)) {
      await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
    }
  }
)

export default diffGoals
