import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, diffChanges } from '../lib/saveUtils'
import saveToAPI from './saveToAPI'

export class DiffBaseYearJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    existingCompany: any
    wikidata: { node: string }
    baseYear: any
  }
}

const diffBaseYear = new DiscordWorker<DiffBaseYearJob>(
  'diffBaseYear',
  async (job) => {
    const { url, companyName, existingCompany, baseYear } = job.data
    const metadata = defaultMetadata(url)

    console.log('job data', job.data)

    const body = {
      baseYear,
      metadata,
    }

    const { diff, requiresApproval } = await diffChanges({
      existingCompany,
      before: existingCompany?.baseYear,
      after: baseYear,
    })

    if (diff) {
      await saveToAPI.queue.add(companyName + ' baseYear', {
        ...job.data,
        body,
        diff,
        requiresApproval,
        apiSubEndpoint: 'baseYear',
        baseYear: undefined,
      })
    }

    return { body, diff, requiresApproval }
  }
)

export default diffBaseYear
