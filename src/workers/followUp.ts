import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb'
import chromadb from '../config/chromadb'
import { askStream } from '../openai'
import { saveCompany, saveToAPI } from '../lib/api'

const embedder = new OpenAIEmbeddingFunction({
  openai_api_key: process.env.OPENAI_API_KEY,
})

class JobData extends Job {
  declare data: {
    wikidataId: string
    documentId: string
    url: string
    apiSubEndpoint: string
    prompt: string
    schema: string
    threadId: string
    json: string
    previousAnswer: string
    previousError: string
  }
}

const worker = new Worker(
  'followUp',
  async (job: JobData) => {
    const {
      prompt,
      schema,
      url,
      json,
      previousAnswer,
      apiSubEndpoint,
      previousError,
      wikidataId,
    } = job.data

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

    let progress = 0
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
        { role: 'assistant', content: previousAnswer },
        { role: 'user', content: previousError },
      ].filter((m) => m.content) as any[],
      {
        response_format: schema,
      }
    )

    job.log('NEW Response: ' + response)

    try {
      const jsonMatch = response.match(/```json([\s\S]*?)```/)
      const json = JSON.parse(jsonMatch ? jsonMatch[1].trim() : response)
      const metadata = {
        source: url,
        comment: 'Parsed with AI by Garbo',
      }
      await saveCompany(wikidataId, apiSubEndpoint, { ...json, metadata })
      job.log('Saved to API')
      return JSON.stringify(json, null, 2)
    } catch (error) {
      job.updateData({
        ...job.data,
        previousAnswer: response,
        previousError: error.message,
      })
      throw error
    }
  },
  {
    concurrency: 10,
    connection: redis,
  }
)

export default worker
