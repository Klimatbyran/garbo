import { EntityId } from 'wikibase-sdk'
import { PipelineJob, PipelineWorker } from '../lib/PipelineWorker'
import { QUEUE_NAMES } from '../queues'
import { getLEINumbersFromGLEIF } from '../lib/gleif'
import { ask } from '../lib/openai'
import { leiPrompt, leiSchema, parseLeiLlmResponse } from '../prompts/lei'
import { zodResponseFormat } from 'openai/helpers/zod'
import { ChatCompletionMessageParam } from 'openai/resources'
import { getLEINumber } from '@/lib/wikidata/read'

export class LEIJob extends PipelineJob {
  declare data: PipelineJob['data'] & {
    companyName: string
    wikidataId: string
  }
}

const extractLEI = new PipelineWorker<LEIJob>(
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
        let response: string
        try {
          response = await ask(
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
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          job.log(`❌ LLM request failed for '${companyName}': ${message}`)
          await job.sendMessage(
            `❌ Failed to look up LEI for ${companyName}: ${message}`
          )
          return { lei: undefined, wikidataId: wikidataId }
        }

        job.log('Response: ' + response)

        const parsed = parseLeiLlmResponse(response)
        if (!parsed.success) {
          job.log(`Failed to parse GLEIF response: ${parsed.error}`)
          job.log(`Raw response: ${response}`)
          await job.sendMessage(
            `❌ Could not parse LEI selection for ${companyName}. The AI service returned an unexpected response.`
          )
          return { lei: undefined, wikidataId: wikidataId }
        }

        return { lei: parsed.data.lei, wikidataId: wikidataId }
      }
    }
    job.log(`✅ Found LEI for '${companyName}': ${lei}`)
    return { lei: lei, wikidataId: wikidataId }
  }
)

export default extractLEI
