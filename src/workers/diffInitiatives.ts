import apiConfig from '../config/api'
import { ChangeDescription, DiffJob, DiffWorker } from '../lib/DiffWorker'
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

    if (job.isDataApproved()) {
      await job.enqueueSaveToAPI(
        'initiatives',
        companyName,
        wikidata,
        job.getApprovedBody(),
      )
      return
    }

    if (!job.hasApproval()) {
      const { diff, requiresApproval } = await diffChanges({
        existingCompany,
        before: existingCompany?.initiatives,
        after: initiatives,
      })

      const change: ChangeDescription = {
        type: 'initiatives',
        oldValue: { initiatives: existingCompany.initiatives },
        newValue: { initiatives: initiatives },
      }

      await job.handleDiff(
        'initiatives',
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

export default diffInitiatives
