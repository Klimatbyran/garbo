import { EntityId } from 'wikibase-sdk'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { QUEUE_NAMES } from '../queues'
import { getLEINumbersFromGLEIF } from '../lib/gleif'
import { ask } from '../lib/openai'
import { leiPrompt, leiSchema } from '../prompts/lei'
import { zodResponseFormat } from 'openai/helpers/zod'
import { ChatCompletionMessageParam } from 'openai/resources'
import { getLEINumber } from '@/lib/wikidata/read'

export class LEIJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidataId: string
  }
}

const extractLEI = new DiscordWorker<LEIJob>(
  QUEUE_NAMES.EXTRACT_LEI,
  async (job: LEIJob) => {
    const { wikidataId, companyName } = job.data

    const lei = await getLEINumber(wikidataId as EntityId)

    if (!lei) {
      job.log(`❌ Could not find a valid LEI for '${companyName}' in Wikidata.`)

      const searchResults = await getLEINumbersFromGLEIF(companyName)

      job.log('Results: ' + JSON.stringify(searchResults, null, 2))
      if (searchResults.length === 0) {
        await job.sendMessage(
          `❌ Did not find any LEI number for: ${companyName}.`
        )
        job.log(`❌ Could not find a valid LEI for '${companyName}' in GLEIF.`)
        return { lei: undefined, wikidataId: wikidataId }
      } else {
        const response = await ask(
          [
            {
              role: 'system',
              content: `I have a company named ${companyName} and I am looking for the wikidata entry related to this company. Be helpful and try to be accurate.`,
            },
            { role: 'user', content: leiPrompt },
            {
              role: 'assistant',
              content: 'OK. Just send me the wikidata search results?',
            },
            {
              role: 'user',
              content: JSON.stringify(searchResults, null, 2),
            },
            Array.isArray(job.stacktrace)
              ? { role: 'user', content: job.stacktrace.join('\n') }
              : undefined,
          ].filter(
            (m) => m && m.content?.length > 0
          ) as ChatCompletionMessageParam[],
          { response_format: zodResponseFormat(leiSchema, 'lei') }
        )

        job.log('Response: ' + response)

        const { success, error, data } = leiSchema.safeParse(
          JSON.parse(response)
        )

        if (error || !success) {
          job.log('Failed to parse GLEIF response: ' + error.message)
        }
        return { lei: data?.lei, wikidataId: wikidataId }
      }
    }
    job.log(`✅ Found LEI for '${companyName}': ${lei}`)
    return { lei: lei, wikidataId: wikidataId }
  }
)

export default extractLEI
