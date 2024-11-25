import { askStream } from '../lib/openai'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { JobType } from '../types'

import { zodResponseFormat } from 'openai/helpers/zod'
import { resolve } from 'path'
import { vectorDB } from '../lib/vectordb'

class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    documentId: string
    apiSubEndpoint: string
    type: JobType
    json: string
    previousAnswer: string
  }
}

const followUp = new DiscordWorker<JobData>(
  'followUp',
  async (job: JobData) => {
    const { type, url, previousAnswer } = job.data

    const {
      default: { schema, prompt, queryTexts },
    } = await import(resolve(import.meta.dirname, `../prompts/${type}`))

    const markdown = await vectorDB.getRelevantMarkdown(url, queryTexts, 5)

    job.log(`Reflecting on: ${prompt}
    
    Context:
    ${markdown}
    
    `)

    const response = await askStream(
      [
        {
          role: 'system',
          content:
            'You are an expert in CSRD and will provide accurate data from a PDF with company CSRD reporting. Be consise and accurate.',
        },
        {
          role: 'user',
          content: 'Results from PDF: \n' + markdown,
        },
        {
          role: 'user',
          content: `This is the result of a previous prompt:

## Please add diffs to the prompt based on the instructions:
${prompt}

## Output:
For example, if you want to add a new field called "industry" the response should look like this (only reply with valid json):
{
  "industry": {...}
}
`,
        },
        Array.isArray(job.stacktrace)
          ? [
              { role: 'assistant', content: previousAnswer },
              { role: 'user', content: job.stacktrace.join('') },
            ]
          : undefined,
      ]
        .flat()
        .filter((m) => m?.content) as any[],
      {
        response_format: zodResponseFormat(schema, type.replace(/\//g, '-')),
      }
    )

    job.log('Response: ' + response)
    return response
  }
)

export default followUp
