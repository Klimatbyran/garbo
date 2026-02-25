import { askStream } from './openai'
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources/chat/completions'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

export const askStreamWithContext = async (
  markdown: string,
  prompt: string,
  schema: z.ZodSchema,
  type: string
) => {
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
    ]
      .flat()
      .filter((m) => m !== undefined)
      .filter((m) => m?.content),
    {
      response_format: zodResponseFormat(schema, type.replace(/\//g, '-')),
    },
  )

  return response
}
