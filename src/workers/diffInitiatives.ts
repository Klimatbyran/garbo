import apiConfig from '../config/api'
import {
  ChangeDescription,
  DiffJob,
  DiffWorker,
  isApprovedForDiffType,
  isPendingApprovalForDiffType,
  shouldRunDiffComputation,
} from '../lib/DiffWorker'
import { defaultMetadata, diffChanges } from '../lib/saveUtils'
import { QUEUE_NAMES } from '../queues'
import { Initiative } from '../types'

export class DiffInitiativesJob extends DiffJob {
  declare data: DiffJob['data'] & {
    companyName: string
    existingCompany: any
    wikidata: { node: string }
    initiatives: Initiative[]
  }
}

const INITIATIVES_ENDPOINT = 'initiatives'

const diffInitiatives = new DiffWorker<DiffInitiativesJob>(
  QUEUE_NAMES.DIFF_INITIATIVES,
  async (job) => {
    const {
      url,
      companyName,
      existingCompany,
      initiatives,
      autoApprove,
      wikidata,
    } = job.data
    const metadata = defaultMetadata(url)

    if (isApprovedForDiffType(job, INITIATIVES_ENDPOINT)) {
      await job.enqueueSaveToAPI(
        INITIATIVES_ENDPOINT,
        companyName,
        job.getApprovedBody()
      )
      return
    }

    if (shouldRunDiffComputation(job, INITIATIVES_ENDPOINT)) {
      const { diff, requiresApproval } = await diffChanges({
        existingCompany,
        before: existingCompany?.initiatives,
        after: initiatives,
      })

      const previousInitiatives = existingCompany?.initiatives ?? []

      const change: ChangeDescription = {
        type: 'initiatives',
        oldValue: { initiatives: previousInitiatives },
        newValue: { initiatives },
      }

      await job.handleDiff(
        INITIATIVES_ENDPOINT,
        diff,
        change,
        typeof requiresApproval == 'boolean' ? requiresApproval : false
      )
    }

    if (isPendingApprovalForDiffType(job, INITIATIVES_ENDPOINT)) {
      await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
    }
  }
)

export default diffInitiatives
