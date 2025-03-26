import { askStream } from '../lib/openai'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { JobType } from '../types'
import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources'
import { zodResponseFormat } from 'openai/helpers/zod'
import { resolve } from 'path'
import { vectorDB } from '../lib/vectordb'

class FollowUpJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    documentId: string
    type: JobType
    previousAnswer: string
  }
}

const followUp = new DiscordWorker<FollowUpJob>(
  'followUp',
  async (job: FollowUpJob) => {
    const { type, url, previousAnswer } = job.data
    const {
      default: { schema, prompt, queryTexts },
    } = await import(resolve(import.meta.dirname, `../prompts/${type}`))

    const markdown = await vectorDB.getRelevantMarkdown(url, queryTexts, 15)

    job.log(`Reflecting on: ${prompt}
    
    Context:
    ${markdown}
    
    `)

    const response = await askStream(
      [
        {
          role: 'system',
          content:
            'You are an expert in CSRD and will provide accurate data from a PDF with company CSRD reporting. Be consise and accurate.',
        } as ChatCompletionSystemMessageParam,
        {
          role: 'user',
          content: 'Results from PDF: \n' + markdown,
        } as ChatCompletionUserMessageParam,
        {
          role: 'user',
          content: prompt,
        } as ChatCompletionUserMessageParam,
        Array.isArray(job.stacktrace)
          ? [
              {
                role: 'assistant',
                content: previousAnswer,
              } as ChatCompletionAssistantMessageParam,
              {
                role: 'user',
                content: job.stacktrace.join(''),
              } as ChatCompletionUserMessageParam,
            ]
          : undefined,
      ]
        .flat()
        .filter((m) => m !== undefined)
        .filter((m) => m?.content),
      {
        response_format: zodResponseFormat(schema, type.replace(/\//g, '-')),
      }
    )

    job.log('Response: ' + response)
    return response
  }
)

export default followUp
