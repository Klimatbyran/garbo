import { askStream } from './openai'
import { DiscordJob, DiscordWorker } from './DiscordWorker'
import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources'
import { zodResponseFormat } from 'openai/helpers/zod'
import { vectorDB } from './vectordb'
import { Queue } from 'bullmq'
import redis from '../config/redis'
import { z } from 'zod'
import { FollowUpType } from '../types'

export class FollowUpJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    documentId: string
    previousAnswer: string
  }

  followUp: (
    url: string,
    previousAnswer: string,
    schema: z.ZodSchema,
    prompt: string,
    queryTexts: string[],
    type: FollowUpType
  ) => Promise<string | undefined>
}

function addCustomMethods(job: FollowUpJob) {
  job.followUp = async (url, previousAnswer, schema, prompt, queryTexts, type) => {
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
  return job
}
export class FollowUpWorker<
  T extends FollowUpJob
> extends DiscordWorker<FollowUpJob> {
  queue: Queue
  constructor(
    name: string,
    callback: (job: T) => any,
    options?: WorkerOptions
  ) {
    super(name, (job: T) => callback(addCustomMethods(job) as T), {
      connection: redis,
      concurrency: 3,
      ...options,
    })

    this.queue = new Queue(name, { connection: redis })
  }
}