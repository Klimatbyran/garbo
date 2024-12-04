import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import redis from '../config/redis'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidata: any
  }
}

const sendCompanyLink = new DiscordWorker<JobData>(
  'sendCompanyLink',
  async (job) => {
    const { companyName, wikidata } = job.data
    const wikidataId = wikidata.node
    
    // Create URL-safe company name
    const urlSafeCompanyName = companyName
      .toLowerCase()
      .replace(/[åä]/g, 'a')
      .replace(/[ö]/g, 'o')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    const url = `http://beta.klimatkollen.se/companies/${wikidataId}-${urlSafeCompanyName}`
    
    await job.sendMessage(`✅ Företaget har sparats! Se resultatet här: ${url}`)
    
    return { url }
  },
  {
    connection: redis,
  }
)

export default sendCompanyLink
