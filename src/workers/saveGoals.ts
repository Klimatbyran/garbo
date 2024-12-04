import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { apiFetch } from '../lib/api'
import { defaultMetadata } from '../lib/saveUtils'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidata: any
    goals?: any
  }
}

const saveGoals = new DiscordWorker<JobData>(
  'saveGoals',
  async (job) => {
    const { url, wikidata, goals } = job.data
    const wikidataId = wikidata.node
    const metadata = defaultMetadata(url)

    if (goals) {
      job.editMessage(`🤖 Sparar mål...`)
      return await apiFetch(`/companies/${wikidataId}/goals`, {
        body: {
          goals,
          metadata,
        },
        method: 'POST',
      })
    }

    return null
  },
)

export default saveGoals
