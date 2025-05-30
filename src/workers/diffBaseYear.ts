import { ChangeDescription } from '../lib/diffUtils'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, diffChanges } from '../lib/saveUtils'
import wikidata from '../prompts/wikidata'
import { QUEUE_NAMES } from '../queues'
import saveToAPI from './saveToAPI'

export class DiffBaseYearJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    existingCompany: any
    baseYear?: number
  }
}

const diffBaseYear = new DiscordWorker<DiffBaseYearJob>(
  QUEUE_NAMES.DIFF_BASE_YEAR,
  async (job) => {
    const { url, companyName, existingCompany, baseYear, autoApprove, ...data } = job.data
    const metadata = defaultMetadata(url)

    const body = {
      baseYear,
      metadata,
    }

    const { diff, requiresApproval } = await diffChanges({
      existingCompany,
      before: existingCompany?.baseYear,
      after: { baseYear },
    })

    const change: ChangeDescription = {
      type: 'baseYear',
      oldValue: { baseYear: existingCompany.baseYear },
      newValue: { baseYear: baseYear },
    }

    job.requestApproval('baseYear', change, autoApprove || !requiresApproval, metadata, 'Updates to the base year');

    if (diff) {
      await saveToAPI.queue.add(companyName + ' base-year', {
        ...data,
        diff,
        requiresApproval,
        apiSubEndpoint: 'base-year',
      })
    }

    return { body, diff, requiresApproval }
  }
)

export default diffBaseYear
