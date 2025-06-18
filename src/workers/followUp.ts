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
import { QUEUE_NAMES } from '../queues'

class FollowUpJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    documentId: string
    type: JobType
    previousAnswer: string
  }
}

async function askAI(
  job,
  url: string,
  type: JobType,
  previousAnswer: string,
  nResults = 15
) {
  const {
    default: { schema, prompt, queryTexts },
  } = await import(resolve(import.meta.dirname, `../prompts/${type}`))

  let markdown = await vectorDB.getRelevantMarkdown(url, queryTexts, nResults)

  job.log(`Reflecting on: ${prompt}
    
    Context:
    ${markdown}
    
    `)

  const messages = [
    {
      role: 'system',
      content: `You are an expert in CSRD and will provide accurate data from a PDF with company CSRD reporting from the company ${job.data.companyName}. Be consise and accurate.`,
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
    .filter((m) => m?.content)

  const response = await askStream(messages, {
    response_format: zodResponseFormat(schema, type.replace(/\//g, '-')),
  })

  return response
}

const followUp = new DiscordWorker<FollowUpJob>(
  QUEUE_NAMES.FOLLOW_UP,
  async (job: FollowUpJob) => {
    const { type, url, previousAnswer } = job.data

    try {
      const response = await askAI(job, url, type, previousAnswer, 15)
      job.log('Response: ' + response)
      return response
    } catch (error) {
      job.log('Error: ' + error)

      // Try progressive reduction strategies
      if (error.message?.includes('maximum context length')) {
        job.log('Retrying with fewer results...')
        try {
          const response = await askAI(job, url, type, previousAnswer, 8)
          return response
        } catch (secondError) {
          job.log('Second attempt failed, trying with minimal context...')
          const response = await askAI(job, url, type, previousAnswer, 5)
          return response
        }
      }

      throw error
    }
  }
)

export default followUp
