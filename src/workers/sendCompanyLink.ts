import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { getCompanyURL } from '../lib/saveUtils'
import { Wikidata } from '../prompts/wikidata'
import { QUEUE_NAMES } from '../queues'

export class SendCompanyLinkJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidata: Wikidata
    existingCompany: any
    url: string
  }
}

const sendCompanyLink = new DiscordWorker<SendCompanyLinkJob>(
  QUEUE_NAMES.SEND_COMPANY_LINK,
  async (job) => {
    const { companyName, wikidata, existingCompany, url: reportUrl } = job.data
    const wikidataId = wikidata.node
    const url = getCompanyURL(companyName, wikidataId)

    if (existingCompany) {
      await job.sendMessage(
        `✅ Företaget har uppdaterats! Se resultatet här: ${url}`
      )
    } else {
      await job.sendMessage(`✅ Se resultatet här: ${url}`)
    }

    // Trigger show notes generation after company link is sent
    try {
      const { queue } = await import('../queues')
      await queue.generateShowNotes.add(`Generate show notes for ${companyName}`, {
        ...job.data,
        url: reportUrl
      })
      job.log(`Triggered show notes generation for ${companyName}`)
    } catch (error) {
      job.log(`Failed to trigger show notes generation: ${error.message}`)
    }

    return { url }
  }
)

export default sendCompanyLink
