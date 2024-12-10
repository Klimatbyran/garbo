import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { getCompanyURL } from '../lib/saveUtils'

export class SendCompanyLinkJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidata: any
    existingCompany: any
  }
}

const sendCompanyLink = new DiscordWorker<SendCompanyLinkJob>(
  'sendCompanyLink',
  async (job) => {
    const { companyName, wikidata, existingCompany } = job.data
    const wikidataId = wikidata.node
    const url = getCompanyURL(companyName, wikidataId)

    if (existingCompany) {
      await job.sendMessage(
        `✅ Företaget har uppdaterats! Se resultatet här: ${url}`
      )
    } else {
      await job.sendMessage(`✅ Se resultatet här: ${url}`)
    }

    return { url }
  }
)

export default sendCompanyLink
