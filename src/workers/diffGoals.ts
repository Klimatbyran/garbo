import apiConfig from '../config/api'
import { ChangeDescription, DiffJob, DiffWorker } from '../lib/DiffWorker'
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

const diffGoals = new DiffWorker<DiffGoalsJob>(
  QUEUE_NAMES.DIFF_GOALS,
  async (job) => {
    const { wikidata, companyName, existingCompany, goals } = job.data
    if (job.isDataApproved()) {
      await job.enqueueSaveToAPI(
        'goals',
        companyName,
        wikidata,
        job.getApprovedBody(),
      )
      return
    }

    if (!job.hasApproval()) {
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

      await job.handleDiff(
        'goals',
        diff,
        change,
        typeof requiresApproval == 'boolean' ? requiresApproval : false,
      )
    }

    if (job.hasApproval() && !job.isDataApproved()) {
      await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
    }
  },
)

export default diffGoals
