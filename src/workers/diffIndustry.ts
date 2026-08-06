import apiConfig from '../config/api'
import {
  DiffJob,
  ChangeDescription,
  DiffWorker,
  isApprovedForDiffType,
  isPendingApprovalForDiffType,
  shouldRunDiffComputation,
} from '../lib/DiffWorker'
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

const INDUSTRY_ENDPOINT = 'industry'

const diffIndustry = new DiffWorker<DiffIndustryJob>(
  QUEUE_NAMES.DIFF_INDUSTRY,
  async (job) => {
    const { wikidata, companyName, existingCompany, industry } = job.data

    if (isApprovedForDiffType(job, INDUSTRY_ENDPOINT)) {
      await job.enqueueSaveToAPI(
        INDUSTRY_ENDPOINT,
        companyName,
        job.getApprovedBody()
      )
      return
    }

    if (shouldRunDiffComputation(job, INDUSTRY_ENDPOINT)) {
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
        INDUSTRY_ENDPOINT,
        diff,
        change,
        typeof requiresApproval == 'boolean' ? requiresApproval : false
      )
    }

    if (isPendingApprovalForDiffType(job, INDUSTRY_ENDPOINT)) {
      await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
    }
  }
)

export default diffIndustry
