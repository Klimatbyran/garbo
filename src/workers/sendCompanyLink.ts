import { PipelineJob, PipelineWorker } from '../lib/DiscordWorker'
import { getCompanyURL } from '../lib/saveUtils'
import { Wikidata } from '../prompts/wikidata'
import { QUEUE_NAMES } from '../queues'

export class SendCompanyLinkJob extends PipelineJob {
  declare data: PipelineJob['data'] & {
    companyName: string
    wikidata: Wikidata
    existingCompany: any
  }
}

const sendCompanyLink = new PipelineWorker<SendCompanyLinkJob>(
  QUEUE_NAMES.SEND_COMPANY_LINK,
  async (job) => {
    const { companyName, wikidata, existingCompany } = job.data
    const wikidataId = wikidata.node
    const url = getCompanyURL(companyName, wikidataId)

    if (existingCompany) {
      await job.sendMessage(
        `✅ The company has been updated! See the result here: ${url}`
      )
    } else {
      await job.sendMessage(`✅ See the result here: ${url}`)
    }

    return { url }
  }
)

export default sendCompanyLink
