import { ask } from './openai'
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources/chat/completions'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import { AskOptions } from '@/types'
import { SYSTEM_PROMPT_CSRD } from '@/constants/prompts'

export const askWithContext = async (
  markdown: string,
  prompt: string,
  schema: z.ZodSchema,
  type: string,
  options?: AskOptions,
) => {
  const response = await ask(
    [
      {
        role: 'system',
        content: SYSTEM_PROMPT_CSRD,
      } as ChatCompletionSystemMessageParam,
      {
        role: 'user',
        content: 'Results from PDF: \n' + markdown,
      } as ChatCompletionUserMessageParam,
      {
        role: 'user',
        content: prompt,
      } as ChatCompletionUserMessageParam,
    ]
      .flat()
      .filter((m) => m !== undefined)
      .filter((m) => m?.content),
    {
      ...options,
      response_format: zodResponseFormat(schema, type.replace(/\//g, '-')),
    },
  )

  return response
}
