import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb'
import chromadb from '../config/chromadb'
import { askStream } from '../lib/openai'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import openaiConfig from '../config/openai'
import { JobType } from '../types/Company'

import { zodResponseFormat } from 'openai/helpers/zod'
import { resolve } from 'path'

const embedder = new OpenAIEmbeddingFunction({
  openai_api_key: openaiConfig.openai_api_key,
})

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
    const { type, url, json, previousAnswer, apiSubEndpoint, wikidataId } =
      job.data

    console.log('type', type)

    const {
      default: { schema, prompt },
    } = await import(resolve(import.meta.dirname, `../prompts/${type}`))

    console.log(
      schema,
      prompt,
      resolve(import.meta.dirname, `../prompts/${type}`)
    )

    // TODO: Move these to an helper function, e.g. getParagraphs()
    const client = new ChromaClient(chromadb)
    const collection = await client.getCollection({
      name: 'emission_reports',
      embeddingFunction: embedder,
    })
    /* might get better results if we query for imaginary results from a query instead of the actual query
    const query = await ask([
      {
        role: 'user',
        content:
          'Please give me some example data from this prompt that I can use as search query in a vector database indexed from PDFs. OK?'
      },
      {role: 'assistant', content: 'OK sure, give '},
          prompt,
      },
    ])*/

    const results = await collection.query({
      nResults: 5,
      where: {
        source: url,
      },
      queryTexts: [prompt],
    })
    const pdfParagraphs = results.documents.flat()

    job.log(`Reflecting on: ${prompt}
    ${json}
    
    Context:
    ${pdfParagraphs.join('\n\n----------------\n\n')}
    
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
          content:
            'Results from PDF: \n' +
            pdfParagraphs.join('\n\n------------------------------\n\n'),
        },
        {
          role: 'user',
          content: `This is the result of a previous prompt:


\`\`\`json
${json}
\`\`\`

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
        response_format: zodResponseFormat(schema, type),
      }
    )

    job.log('Response: ' + response)
    return response
  }
)

export default followUp
