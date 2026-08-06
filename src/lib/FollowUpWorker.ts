import { askStream } from './openai'
import { PipelineJob, PipelineWorker } from './PipelineWorker'
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

export class FollowUpJob extends PipelineJob {
  declare data: PipelineJob['data'] & {
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

function ensureValidFollowUpInputs(
  markdown: string | null | undefined,
  prompt: string | null | undefined,
  queryTexts: string[] | null | undefined,
  type: FollowUpType
): void {
  if (!markdown || !markdown.trim()) {
    throw new Error(`Missing markdown context for follow-up: ${type}`)
  }

  if (!prompt || !prompt.trim()) {
    throw new Error(`Missing prompt for follow-up: ${type}`)
  }

  if (!Array.isArray(queryTexts) || queryTexts.length === 0) {
    throw new Error(`Missing query texts for follow-up: ${type}`)
  }
}

function addCustomMethods(job: FollowUpJob) {
  job.followUp = async (
    url,
    previousAnswer,
    schema,
    prompt,
    queryTexts,
    type
  ) => {
    job.log(`🔍 Querying vector DB for ${type}...`)
    const chromaStart = Date.now()
    const markdown = await vectorDB.getRelevantMarkdown(
      url,
      queryTexts,
      15,
      (msg) => job.log(msg)
    )
    const chromaDurationMs = Date.now() - chromaStart
    job.log(
      `✅ Vector DB done for ${type} (${markdown.length} chars, ${chromaDurationMs}ms)`
    )
    ensureValidFollowUpInputs(markdown, prompt, queryTexts, type)

    job.log(`Reflecting on: ${prompt}

    Context:
    ${markdown}

    `)

    const streamMessages = [
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
      .filter((message) => message !== undefined)
      .filter((message) => message?.content)

    const aiStart = Date.now()
    const response = await askStream(streamMessages, {
      response_format: zodResponseFormat(schema, type.replace(/\//g, '-')),
    })
    const aiDurationMs = Date.now() - aiStart

    job.log('Response: ' + response)

    const result = {
      value: JSON.parse(response),
      metadata: {
        context: markdown,
        prompt: prompt,
        queryTexts,
        schema: zodResponseFormat(schema, type.replace(/\//g, '-')),
        chromaDurationMs,
        aiDurationMs,
      },
    }

    return JSON.stringify(result)
  }
  return job
}
export class FollowUpWorker<
  T extends FollowUpJob,
> extends PipelineWorker<FollowUpJob> {
  queue: Queue
  constructor(
    name: string,
    callback: (job: T) => any,
    options?: WorkerOptions
  ) {
    super(name, (job: T) => callback(addCustomMethods(job) as T), {
      connection: redis,
      concurrency: 1,
      ...options,
    })

    this.queue = new Queue(name, { connection: redis })
  }
}
