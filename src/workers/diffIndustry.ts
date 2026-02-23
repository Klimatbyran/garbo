import apiConfig from '../config/api'
import { DiffJob, ChangeDescription, DiffWorker } from '../lib/DiffWorker'
import { diffChanges } from '../lib/saveUtils'
import { QUEUE_NAMES } from '../queues'

export class DiffIndustryJob extends DiffJob {
  declare data: DiffJob['data'] & {
    existingCompany: any
    companyName: string
    wikidata: { node: string }
    industry: any
  }
}

const diffIndustry = new DiffWorker<DiffIndustryJob>(
  QUEUE_NAMES.DIFF_INDUSTRY,
  async (job) => {
    const { wikidata, companyName, existingCompany, industry } = job.data

    if (job.isDataApproved()) {
      await job.enqueueSaveToAPI(
        'industry',
        companyName,
        wikidata,
        job.getApprovedBody(),
      )
      return
    }

    if (!job.hasApproval()) {
      const { diff, requiresApproval } = await diffChanges({
        existingCompany,
        before: existingCompany?.industry,
        after: industry,
      })

      const change: ChangeDescription = {
        type: 'industry',
        oldValue: { industry: existingCompany?.industry },
        newValue: { industry: industry },
      }

      await job.handleDiff(
        'industry',
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

export default diffIndustry
