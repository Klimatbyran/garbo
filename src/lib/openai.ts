import { assert } from 'console'
import OpenAI from 'openai'
import {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
} from 'openai/resources'
import openaiConfig from '../config/openai'
import { AskOptions } from '@/types'

const openai = new OpenAI({
  apiKey: openaiConfig.apiKey,
})

const ask = async (
  messages: ChatCompletionMessageParam[],
  options?: AskOptions,
) => {
  const {
    baseUrl,
    apiKey,
    model,
    response_format: _unusedResponseFormat,
    onParagraph: _unusedOnParagraph,
    temperature,
    max_tokens,
    ...requestOptions
  } = options ?? {}

  const client =
    baseUrl || apiKey
      ? new OpenAI({
          baseURL: baseUrl,
          apiKey: apiKey ?? openaiConfig.apiKey,
          organization: openaiConfig.organization,
        })
      : openai

  const config = {
    messages: messages.filter((m) => m.content),
    model: model ?? 'gpt-4o-2024-08-06',
    temperature: temperature ?? 0.1,
    max_tokens: max_tokens ?? 4096,
    response_format: options?.response_format,
    stream: false,
  } satisfies ChatCompletionCreateParamsNonStreaming

  const response = await client.chat.completions.create(config, requestOptions)

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
