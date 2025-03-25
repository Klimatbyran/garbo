import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, diffChanges } from '../lib/saveUtils'
import { QUEUE_NAMES } from '../queues'
import saveToAPI from './saveToAPI'

export class DiffBaseYearJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    existingCompany: any
    wikidata: { node: string }
    baseYear?: number
  }
}

const diffBaseYear = new DiscordWorker<DiffBaseYearJob>(
  QUEUE_NAMES.DIFF_BASE_YEAR,
  async (job) => {
    const { url, companyName, existingCompany, baseYear } = job.data
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

    if (diff) {
      await saveToAPI.queue.add(companyName + ' base-year', {
        ...job.data,
        body,
        diff,
        requiresApproval,
        apiSubEndpoint: 'base-year',
      })
    }

    return { body, diff, requiresApproval }
  }
)

export default diffBaseYear
