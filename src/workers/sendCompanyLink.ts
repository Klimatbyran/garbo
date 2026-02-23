import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { getCompanyURL } from '../lib/saveUtils'
import { Wikidata } from '../prompts/wikidata'
import { QUEUE_NAMES } from '../queues'

export class SendCompanyLinkJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidata: Wikidata
    existingCompany: any
  }
}

const sendCompanyLink = new DiscordWorker<SendCompanyLinkJob>(
  QUEUE_NAMES.SEND_COMPANY_LINK,
  async (job) => {
    const { companyName, wikidata, existingCompany } = job.data
    const wikidataId = wikidata.node
    const url = getCompanyURL(companyName, wikidataId)

    if (existingCompany) {
      await job.sendMessage(
        `✅ The company has been updated! See the result here: ${url}`,
      )
    } else {
      await job.sendMessage(`✅ See the result here: ${url}`)
    }

    return { url }
  },
)

export default sendCompanyLink
