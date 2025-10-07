import { assert } from 'console'
import OpenAI from 'openai'
import {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
} from 'openai/resources'
import openaiConfig from '../config/openai'
import { AskOptions } from '@/types'
import {
  DEFAULT_MODEL,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
} from '@/constants/ai'
import { SYSTEM_PROMPT_GENERIC } from '@/constants/prompts'
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
    response_format,
    onParagraph: _unusedOnParagraph,
    temperature,
    max_tokens,
  } = options ?? {}

  const client =
    baseUrl || apiKey
      ? new OpenAI({
          baseURL: baseUrl,
          apiKey: apiKey ?? openaiConfig.apiKey,
          ...(baseUrl ? {} : { organization: openaiConfig.organization }),
        })
      : openai

  const config = {
    messages: messages.filter((m) => m.content),
    model: model ?? DEFAULT_MODEL,
    temperature: temperature ?? DEFAULT_TEMPERATURE,
    max_tokens: max_tokens ?? DEFAULT_MAX_TOKENS,
    response_format: baseUrl
      ? {
          type: 'json_object' as const,
          schema: response_format?.json_schema.schema,
        }
      : response_format,
  }

  try {
    const response = await client.chat.completions.create(config)
    return response.choices[0].message.content ?? ''
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      console.log(error.request_id)
      console.log(error.status)
      console.log(error.name)
      console.log(error.headers)
    } else {
      throw error
    }
  }
}

const askPrompt = async (prompt: string, context: string) => {
  assert(prompt, 'Prompt is required')
  assert(context, 'Context is required')
  return await ask([
    {
      role: 'system',
      content: SYSTEM_PROMPT_GENERIC,
    },
    { role: 'user', content: prompt },
    { role: 'assistant', content: 'Sure! Just send me the context?' },
    { role: 'user', content: context },
  ])
}

export { openai, ask, askPrompt }
