import apiConfig from '../config/api'
import { ChangeDescription, DiffJob, DiffWorker } from '../lib/DiffWorker'
import { diffChanges } from '../lib/saveUtils'
import { QUEUE_NAMES } from '../queues'

export class DiffBaseYearJob extends DiffJob {
  declare data: DiffJob['data'] & {
    companyName: string
    existingCompany: any
    baseYear?: number
  }
}

const diffBaseYear = new DiffWorker<DiffBaseYearJob>(
  QUEUE_NAMES.DIFF_BASE_YEAR,
  async (job) => {
    const { companyName, existingCompany, baseYear, wikidata } = job.data

    if (job.isDataApproved()) {
      await job.enqueueSaveToAPI(
        'baseYear',
        companyName,
        wikidata,
        job.getApprovedBody()
      )
      return
    }

    if (!job.hasApproval()) {
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
        'baseYear',
        diff,
        change,
        typeof requiresApproval == 'boolean' ? requiresApproval : false
      )
    }

    if (job.hasApproval() && !job.isDataApproved()) {
      try {
        await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
      } catch(_err) {}      
    }
  }
)

export default diffBaseYear
