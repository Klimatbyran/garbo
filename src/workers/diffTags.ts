import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, diffChanges } from '../lib/saveUtils'
import { QUEUE_NAMES } from '../queues'
import saveToAPI from './saveToAPI'

export class DiffTagsJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    existingCompany: any
    wikidata: { node: string }
    tags: string[]
  }
}

const diffTags = new DiscordWorker<DiffTagsJob>(
  QUEUE_NAMES.DIFF_TAGS,
  async (job) => {
    const { url, companyName, existingCompany, tags } = job.data
    const metadata = defaultMetadata(url)

    const body = {
      tags,
      metadata,
    }

    const { diff, requiresApproval } = await diffChanges({
      existingCompany,
      before: existingCompany?.tags,
      after: tags,
    })

    job.log('Diff:' + diff)

    // Only save if we detected any meaningful changes
    if (diff) {
      await saveToAPI.queue.add(companyName + ' tags', {
        ...job.data,
        body,
        diff,
        requiresApproval,
        apiSubEndpoint: 'tags',

        // Remove duplicated job data that should be part of the body from now on
        tags: undefined,
      })
    }

    return { body, diff, requiresApproval }
  },
)

export default diffTags
