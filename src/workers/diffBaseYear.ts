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

export class DiffBaseYearJob extends DiffJob {
  declare data: DiffJob['data'] & {
    companyName: string
    existingCompany: any
    baseYear?: number
  }
}

const BASE_YEAR_ENDPOINT = 'base-year'

const diffBaseYear = new DiffWorker<DiffBaseYearJob>(
  QUEUE_NAMES.DIFF_BASE_YEAR,
  async (job) => {
    const { companyName, existingCompany, baseYear, wikidata } = job.data

    if (isApprovedForDiffType(job, BASE_YEAR_ENDPOINT)) {
      await job.enqueueSaveToAPI(
        BASE_YEAR_ENDPOINT,
        companyName,
        job.getApprovedBody()
      )
      return
    }

    if (shouldRunDiffComputation(job, BASE_YEAR_ENDPOINT)) {
      const { diff, requiresApproval } = await diffChanges({
        existingCompany,
        before: existingCompany?.baseYear,
        after: { baseYear },
      })

      const change: ChangeDescription = {
        type: 'baseYear',
        oldValue: { baseYear: existingCompany?.baseYear?.year ?? null },
        newValue: { baseYear: baseYear },
      }

      await job.handleDiff(
        BASE_YEAR_ENDPOINT,
        diff,
        change,
        typeof requiresApproval == 'boolean' ? requiresApproval : false
      )
    }

    if (isPendingApprovalForDiffType(job, BASE_YEAR_ENDPOINT)) {
      try {
        await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
      } catch (_err) {}
    }
  }
)

export default diffBaseYear
