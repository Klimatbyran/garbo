import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { apiFetch } from '../lib/api'
import { defaultMetadata } from '../lib/saveUtils'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidata: any
    initiatives?: any
  }
}

const saveInitiatives = new DiscordWorker<JobData>(
  'saveInitiatives',
  async (job) => {
    const { url, wikidata, initiatives } = job.data
    const wikidataId = wikidata.node
    const metadata = defaultMetadata(url)

    if (initiatives) {
      job.editMessage(`🤖 Sparar initiativ...`)
      return await apiFetch(`/companies/${wikidataId}/initiatives`, {
        body: {
          initiatives,
          metadata,
        },
        method: 'POST',
      })
    }

    return null
  },
)

export default saveInitiatives
