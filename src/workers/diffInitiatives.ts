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
import { Initiative } from '../types'

export class DiffInitiativesJob extends DiffJob {
  declare data: DiffJob['data'] & {
    companyName: string
    existingCompany: any
    wikidata: { node: string }
    initiatives: Initiative[]
    registryReportId?: string
  }
}

const INITIATIVES_ENDPOINT = 'initiatives'

const diffInitiatives = new DiffWorker<DiffInitiativesJob>(
  QUEUE_NAMES.DIFF_INITIATIVES,
  async (job) => {
    const { companyName, existingCompany, initiatives, registryReportId } =
      job.data
    const saveExtras = goalsInitiativesSaveExtras(job.data)

    if (isApprovedForDiffType(job, INITIATIVES_ENDPOINT)) {
      await job.enqueueSaveToAPI(INITIATIVES_ENDPOINT, companyName, {
        ...job.getApprovedBody(),
        ...saveExtras,
      })
      return
    }

    if (shouldRunDiffComputation(job, INITIATIVES_ENDPOINT)) {
      const previousInitiatives = filterByReportId(
        existingCompany?.initiatives,
        registryReportId
      )

      const { diff, requiresApproval } = await diffChanges({
        existingCompany,
        before: stripGoalInitiativeDiffNoise(previousInitiatives),
        after: stripGoalInitiativeDiffNoise(initiatives as any),
      })

      const change: ChangeDescription = {
        type: 'initiatives',
        oldValue: { initiatives: previousInitiatives },
        newValue: { initiatives },
      }

      await job.handleDiff(
        INITIATIVES_ENDPOINT,
        diff,
        change,
        typeof requiresApproval == 'boolean' ? requiresApproval : false,
        { saveBodyExtras: saveExtras }
      )
    }

    if (isPendingApprovalForDiffType(job, INITIATIVES_ENDPOINT)) {
      await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
    }
  }
)

export default diffInitiatives
