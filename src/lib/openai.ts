import { assert } from 'console'
import OpenAI from 'openai'
import {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
  ResponseFormatJSONSchema,
} from 'openai/resources'
import openaiConfig from '../config/openai'
import { RequestOptions } from 'openai/core'

const openai = new OpenAI({
  apiKey: openaiConfig.apiKey,
})

const ask = async (
  messages: ChatCompletionMessageParam[],
  options?: RequestOptions & {
    onParagraph?: (response: string, paragraph: string) => void
  } & { response_format?: ResponseFormatJSONSchema },
) => {
  const config = {
    messages: messages.filter((m) => m.content),
    model: 'gpt-4o-2024-08-06',
    temperature: 0.1,
    max_tokens: 4096,
    response_format: options?.response_format,
    stream: false,
    ...options,
  } satisfies ChatCompletionCreateParamsNonStreaming

  const response = await openai.chat.completions.create(
    config as ChatCompletionCreateParamsNonStreaming,
  )

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

export { openai, ask, askPrompt }
