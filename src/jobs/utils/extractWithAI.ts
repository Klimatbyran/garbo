import { AskOptions } from '@/types'
import { askWithContext } from '../../lib/ai-utils'
import { vectorDB } from '../../lib/vectordb'
import { z } from 'zod'

export const extractDataFromMarkdown = async (
  markdown: string,
  type: string,
  prompt: string,
  schema: z.ZodSchema,
  options?: AskOptions,
) => {
  return await askWithContext(markdown, prompt, schema, type, options)
}

export const extractDataFromUrl = async (
  url: string,
  type: string,
  prompt: string,
  schema: z.ZodSchema,
  queryTexts: string[],
  options?: AskOptions,
) => {
  const markdown = await vectorDB.getRelevantMarkdown(url, queryTexts, 15)
  const response = await extractDataFromMarkdown(
    markdown,
    type,
    prompt,
    schema,
    options,
  )

  return response
}
