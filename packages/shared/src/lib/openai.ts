import { assert } from 'console'
import OpenAI from 'openai'
import { ChatCompletionAssistantMessageParam, ChatCompletionChunk, ChatCompletionCreateParamsNonStreaming, ChatCompletionCreateParamsStreaming, ChatCompletionMessageParam, ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam, ResponseFormatJSONSchema } from 'openai/resources'
import openaiConfig from '../config/openai'
import { Stream } from 'openai/streaming'
import { RequestOptions } from 'openai/core'

const openai = new OpenAI({
  apiKey: openaiConfig.apiKey,
})


const ask = async (messages: ChatCompletionMessageParam[], options?: RequestOptions & {response_format?: ResponseFormatJSONSchema}) => {
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
  messages: (ChatCompletionSystemMessageParam
    | ChatCompletionUserMessageParam
    | ChatCompletionAssistantMessageParam)[],
  options: RequestOptions  & {onParagraph?: (response: string, paragraph: string) => void} & {response_format?: ResponseFormatJSONSchema}
) => {
  const { stream: _, ...safeOpenAIOptions } = options

  const config = {
    messages: messages.filter((m) => m.content),
    model: 'gpt-4o-2024-08-06',
    temperature: 0.1,
    stream: true,
    max_tokens: 16384,
    response_format: options.response_format,
    ...safeOpenAIOptions,
  } satisfies ChatCompletionCreateParamsStreaming;

  const stream:  Stream<ChatCompletionChunk> = await openai.chat.completions.create(config);


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

  return response
}

export { openai, ask, askPrompt, askStream }
