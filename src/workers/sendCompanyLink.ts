import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { getCompanyURL } from '../lib/saveUtils'
import { Wikidata } from '../prompts/wikidata'
import { QUEUE_NAMES } from '../queues'

export class SendCompanyLinkJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidata: Wikidata
    existingCompany: any
    diversityInclusion: any
  }
}

const sendCompanyLink = new DiscordWorker<SendCompanyLinkJob>(
  QUEUE_NAMES.SEND_COMPANY_LINK,
  async (job) => {
    const { companyName, wikidata, existingCompany, diversityInclusion } =
      job.data
    const wikidataId = wikidata.node
    const url = getCompanyURL(companyName, wikidataId)

    if (existingCompany) {
      await job.sendMessage(
        `✅ Företaget har uppdaterats! Se resultatet här: ${url}`
      )
    } else {
      await job.sendMessage(`✅ Se resultatet här: ${url}`)
    }

    if (diversityInclusion) {
      const pretty = JSON.stringify(diversityInclusion, null, 2)
      await job.sendMessage(
        `🧑‍🤝‍🧑 **Diversity & Inclusion summary**:\n${pretty}`
      )
    }

    return { url }
  }
)

export default sendCompanyLink
