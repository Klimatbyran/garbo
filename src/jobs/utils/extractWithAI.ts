import { askStreamWithContext } from '../../lib/ai-utils'
import { vectorDB } from '../../lib/vectordb'
import { z } from 'zod'

export const extractDataFromMarkdown = async (
  markdown: string,
  type: string,
  prompt: string,
  schema: z.ZodSchema,
) => {
  try {
    return await askStreamWithContext(markdown, prompt, schema, type)
  } catch (error: any) {
    const message = error?.message || String(error)
    const name = error?.name || 'Error'
    const stack = error?.stack || undefined
    // Return a JSON string so downstream parsers can JSON.parse it
    return JSON.stringify({
      error: { name, message, stack, stage: 'askStreamWithContext', type },
    })
  }
}

export const extractDataFromUrl = async (
  url: string,
  type: string,
  prompt: string,
  schema: z.ZodSchema,
  queryTexts: string[],
) => {
  let markdown = ''
  try {
    markdown = await vectorDB.getRelevantMarkdown(url, queryTexts, 15)
  } catch (error: any) {
    const message = error?.message || String(error)
    const name = error?.name || 'Error'
    const stack = error?.stack || undefined
    return JSON.stringify({
      error: { name, message, stack, stage: 'getRelevantMarkdown', type, url },
    })
  }

  /*     job.log(`Reflecting on: ${prompt}
    
    Context:
    ${markdown}
    
    `) */

  try {
    const response = await extractDataFromMarkdown(
      markdown,
      type,
      prompt,
      schema,
    )
    return response
  } catch (error: any) {
    const message = error?.message || String(error)
    const name = error?.name || 'Error'
    const stack = error?.stack || undefined
    return JSON.stringify({
      error: {
        name,
        message,
        stack,
        stage: 'extractDataFromMarkdown',
        type,
        url,
      },
    })
  }
}
