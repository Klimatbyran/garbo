import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, askDiff } from '../lib/saveUtils'
import saveToAPI from './saveToAPI'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidata: any
    industry?: any
  }
}

const saveIndustry = new DiscordWorker<JobData>('saveIndustry', async (job) => {
  const { url, wikidata, companyName, industry } = job.data
  const wikidataId = wikidata.node
  const metadata = defaultMetadata(url)

  if (industry) {
    const body = {
      industry,
      metadata,
    }

    const diff = await askDiff(null, { industry })
    const requiresApproval = diff && !diff.includes('NO_CHANGES')

    await saveToAPI.queue.add(companyName, {
      ...job.data,
      data: {
        body,
        diff,
        requiresApproval,
        wikidataId,
      },
    })

    return { body, diff, requiresApproval }
  }

  return null
})

export default saveIndustry
