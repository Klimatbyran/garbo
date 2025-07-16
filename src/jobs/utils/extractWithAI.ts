import { askStreamWithContext } from "../../lib/ai-utils"
import { vectorDB } from "../../lib/vectordb"
import { z } from "zod"

export const extractDataFromMarkdown = async (markdown: string, type: string, prompt: string, schema: z.ZodSchema) => {
    return await askStreamWithContext(markdown, prompt, schema, type)
}



export const extractDataFromUrl = async (url: string, type: string, prompt: string, schema: z.ZodSchema, queryTexts: string[]) => {
    const markdown = await vectorDB.getRelevantMarkdown(url, queryTexts, 15)

/*     job.log(`Reflecting on: ${prompt}
    
    Context:
    ${markdown}
    
    `) */

    const response = await extractDataFromMarkdown(markdown, type, prompt, schema)


    // job.log('Response: ' + response)
    return response
  }

