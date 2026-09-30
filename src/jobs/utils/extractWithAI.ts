import { askStreamWithContext } from '../../lib/ai-utils'
import { AskOptions } from '../promptTestingFramework/types'
import { z } from 'zod'

export const extractDataFromMarkdown = async (
  markdown: string,
  type: string,
  prompt: string,
  schema: z.ZodSchema,
  askOptions?: AskOptions
) => {
  try {
    return await askStreamWithContext(markdown, prompt, schema, type, askOptions)
  } catch (error: any) {
    const message = error?.message || String(error)
    const name = error?.name || 'Error'
    const stack = error?.stack || undefined
    console.error(`[extractDataFromMarkdown] ERROR: ${name}: ${message}`)
    if (error?.status) console.error(`[extractDataFromMarkdown] HTTP status: ${error.status}`)
    if (error?.error) console.error(`[extractDataFromMarkdown] API error body:`, JSON.stringify(error.error, null, 2))
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
  queryTexts: string[]
) => {
  const { vectorDB } = await import('../../lib/vectordb')
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
      schema
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
