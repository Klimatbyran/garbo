import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata } from '../lib/saveUtils'
import { QUEUE_NAMES } from '../queues'
import saveToAPI from './saveToAPI'
import { Description } from '../api/types'
import { askPrompt } from '../lib/openai'

export class DiffDescriptionsJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidataId: string
    existingDescriptions: Description[]
    descriptions: Description[]
  }
}

const diffDescriptions = new DiscordWorker<DiffDescriptionsJob>(
  QUEUE_NAMES.DIFF_DESCRIPTIONS,
  async (job: DiffDescriptionsJob) => {
    const { url, companyName, wikidataId, existingDescriptions, descriptions } =
      job.data
    const metadata = defaultMetadata(url)

    const body = {
      name: companyName,
      wikidataId,
      descriptions: descriptions,
      metadata,
    }

    const diff = await askPrompt(
      `What is changed between these two arrays of objects?
      The arrays contain objects with information about descriptions of a company in different languages.
      If the before value is missing that means the company did not exist previously and everything is a change (No need to mention that just start with something like: "Here is fresh data for you to approve:" and describe the new additions..

      Please respond clearly and concisely in text with markdown formatting:
      - Use simple, reader-friendly language to explain the changes.
      - Do not mention technical details like structure changes or metadata.
      - Avoid repeating unchanged values or years.
      - If nothing important has changed, simply write: "NO_CHANGES."
      
      Summarize the changes and avoid unnecessary repetition.`,

      JSON.stringify({
        before: structuredClone(existingDescriptions),
        after: structuredClone(descriptions),
      }),
    )

    job.log('Diff:' + diff)

    // Only save if we detected any meaningful changes
    if (!diff.includes('NO_CHANGES')) {
      await saveToAPI.queue.add(companyName + ' descriptions', {
        ...job.data,
        body,
        diff,
        apiSubEndpoint: '',
      })
    }

    return { body, diff }
  },
)

export default diffDescriptions
