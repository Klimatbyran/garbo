import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, askDiff } from '../lib/saveUtils'
import saveToAPI from './saveToAPI'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    existingCompany: any
    companyName: string
    wikidata: any
    industry: any
  }
}

const diffIndustry = new DiscordWorker<JobData>('diffIndustry', async (job) => {
  const { url, wikidata, companyName, existingCompany, industry } = job.data
  const wikidataId = wikidata.node
  const metadata = defaultMetadata(url)

  const body = {
    industry,
    metadata,
  }

  const diff = await askDiff(existingCompany.industry, industry)
  const requiresApproval = diff && !diff.includes('NO_CHANGES')

  await saveToAPI.queue.add(companyName, {
    data: {
      ...job.data,
      body,
      diff,
      requiresApproval,
      wikidataId,
    },
  })

  return { body, diff, requiresApproval }
})

export default diffIndustry
