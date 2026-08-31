import { assert } from 'console'
import OpenAI from 'openai'
import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionChunk,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
  ResponseFormatJSONSchema,
} from 'openai/resources'
import openaiConfig from '../config/openai'
import { Stream } from 'openai/streaming'
import { RequestOptions } from 'openai/core'
import { AskOptions } from '../jobs/promptTestingFramework/types'

const openai = new OpenAI({
  apiKey: openaiConfig.apiKey,
})

const ask = async (
  messages: ChatCompletionMessageParam[],
  options?: RequestOptions & { response_format?: ResponseFormatJSONSchema }
) => {
  const response = await openai.chat.completions.create({
    messages: messages.filter((m) => m.content),
    model: 'gpt-4o',
    max_completion_tokens: 16384,
    temperature: 0.1,
    stream: false,
    ...options,
  } as ChatCompletionCreateParamsNonStreaming)

  return response.choices[0].message.content ?? ''
}

const askPrompt = async (prompt: string, context: string) => {
  assert(prompt, 'Prompt is required')
  assert(context, 'Context is required')
  return await ask([
    {
      role: 'system',
      content: 'You are a friendly expert. Be concise and accurate.',
    },
    { role: 'user', content: prompt },
    { role: 'assistant', content: 'Sure! Just send me the context?' },
    { role: 'user', content: context },
  ])
}

const askStream = async (
  messages: (
    | ChatCompletionSystemMessageParam
    | ChatCompletionUserMessageParam
    | ChatCompletionAssistantMessageParam
  )[],
  options: RequestOptions & {
    onParagraph?: (response: string, paragraph: string) => void
  } & { response_format?: ResponseFormatJSONSchema },
  askOptions?: AskOptions
) => {
  const { stream: _, ...safeOpenAIOptions } = options

  const client =
    askOptions?.baseURL || askOptions?.apiKey
      ? new OpenAI({ baseURL: askOptions.baseURL, apiKey: askOptions.apiKey })
      : openai

  const model = askOptions?.model ?? 'gpt-4o-2024-08-06'
  const config = {
    messages: messages.filter((m) => m.content),
    model,
    temperature: askOptions?.temperature ?? 0.1,
    stream: true,
    max_tokens: askOptions?.max_tokens ?? 16384,
    response_format: options.response_format,
    ...safeOpenAIOptions,
  } satisfies ChatCompletionCreateParamsStreaming

  console.log(`[askStream] → ${model} @ ${askOptions?.baseURL ?? 'OpenAI'}`)
  const t0 = Date.now()

  const stream: Stream<ChatCompletionChunk> =
    await client.chat.completions.create(config)

  let response = ''
  let paragraph = ''
  for await (const part of stream) {
    const chunk = part.choices[0]?.delta?.content || ''
    response += chunk
    paragraph += chunk
    if (options?.onParagraph && chunk.includes('\n')) {
      options?.onParagraph(response, paragraph)
      paragraph = ''
    }
  }
  // send the rest if there is any
  if (options?.onParagraph && paragraph)
    options?.onParagraph(response, paragraph)

  console.log(`[askStream] ← ${model} ${Date.now() - t0}ms, ${response.length} chars`)

  return response
}

export { openai, ask, askPrompt, askStream }
