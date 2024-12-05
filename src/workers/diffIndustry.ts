import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, askDiff } from '../lib/saveUtils'
import saveToAPI from './saveToAPI'

export class DiffIndustryJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    existingCompany: any
    companyName: string
    wikidata: any
    industry: any
  }
}

const diffIndustry = new DiscordWorker<DiffIndustryJob>(
  'diffIndustry',
  async (job) => {
    const { url, wikidata, companyName, existingCompany, industry } = job.data
    const wikidataId = wikidata.node
    const metadata = defaultMetadata(url)

    const body = {
      industry,
      metadata,
    }

    const diff = await askDiff(existingCompany?.industry, industry)
    const requiresApproval = diff && !diff.includes('NO_CHANGES')

    await saveToAPI.queue.add(companyName, {
      data: {
        ...job.data,
        body,
        diff,
        requiresApproval,
        wikidataId,
        apiSubEndpoint: 'industry',
      },
    })

    return { body, diff, requiresApproval }
  }
)

export default diffIndustry