import apiConfig from '../config/api'
import {
  ChangeDescription,
  DiffJob,
  DiffWorker,
  isApprovedForDiffType,
  isPendingApprovalForDiffType,
  shouldRunDiffComputation,
} from '../lib/DiffWorker'
import {
  filterByReportId,
  goalsInitiativesSaveExtras,
  stripGoalInitiativeDiffNoise,
} from '../lib/goalsInitiativesSave'
import { diffChanges } from '../lib/saveUtils'
import { QUEUE_NAMES } from '../queues'
import { Goal } from '../types'

export class DiffGoalsJob extends DiffJob {
  declare data: DiffJob['data'] & {
    companyName: string
    existingCompany: any
    wikidata: { node: string }
    goals: Goal[]
    registryReportId?: string
  }
}

const GOALS_ENDPOINT = 'goals'

const diffGoals = new DiffWorker<DiffGoalsJob>(
  QUEUE_NAMES.DIFF_GOALS,
  async (job) => {
    const { companyName, existingCompany, goals, registryReportId } = job.data
    const saveExtras = goalsInitiativesSaveExtras(job.data)

    if (isApprovedForDiffType(job, GOALS_ENDPOINT)) {
      await job.enqueueSaveToAPI(GOALS_ENDPOINT, companyName, {
        ...job.getApprovedBody(),
        ...saveExtras,
      })
      return
    }

    if (shouldRunDiffComputation(job, GOALS_ENDPOINT)) {
      const previousGoals = filterByReportId(
        existingCompany?.goals,
        registryReportId
      )

      const { diff, requiresApproval } = await diffChanges({
        existingCompany,
        before: stripGoalInitiativeDiffNoise(previousGoals),
        after: stripGoalInitiativeDiffNoise(goals as any),
      })

      const change: ChangeDescription = {
        type: 'goals',
        oldValue: { goals: previousGoals },
        newValue: { goals },
      }

      await job.handleDiff(
        GOALS_ENDPOINT,
        diff,
        change,
        typeof requiresApproval == 'boolean' ? requiresApproval : false,
        { saveBodyExtras: saveExtras }
      )
    }

    if (isPendingApprovalForDiffType(job, GOALS_ENDPOINT)) {
      await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
    }
  }
)

export default diffGoals
