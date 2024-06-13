import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import OpenAI from 'openai'
import discord from '../discord'
import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb'
import chromadb from '../config/chromadb'
import { discordReview } from '../queues'
import { askStream } from '../openai'

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
})

const embedder = new OpenAIEmbeddingFunction({
  openai_api_key: process.env.OPENAI_API_KEY,
})

class JobData extends Job {
  data: {
    documentId: string
    url: string
    answer: string
    prompt: string
    threadId: string
    previousError: string
  }
}

const worker = new Worker(
  'followUp',
  async (job: JobData) => {
    const { prompt, url, answer, previousError } = job.data

    const client = new ChromaClient(chromadb)
    const collection = await client.getCollection({
      name: 'emission_reports',
      embeddingFunction: embedder,
    })

    const results = await collection.query({
      nResults: 5,
      where: {
        // TODO: add markdown here?
        source: url,
      },
      queryTexts: [prompt],
    })
    const pdfParagraphs = results.documents.flat()

    job.log(`Reflecting on: ${prompt}
    ${answer}
    
    Context:
    ${pdfParagraphs.join('\n\n')}
    
    `)

    let progress = 0
    const response = await askStream(
      [
        {
          role: 'system',
          content:
            'You are an expert in CSRD and will provide accurate data from a PDF with company CSRD reporting. When asked to use JSON, please use the following format: \n\n```json\n{\n "field": "value"\n}\n``. Never use comments, ... or other non-JSON syntax within the json block even if they are used in the examples.`',
        },
        {
          role: 'user',
          content: pdfParagraphs.join('---- EXTRACT FROM PDF --- \n\n'),
        },
        {
          role: 'user',
          content:
            'This is the result of a previous prompt. Please add diffs to the prompt based on the instructions below. For example, if you want to add a new field called "industry" the resulting prompt should look like this: \n\n```json\n{\n "industry": "Industry Y"\n}\n```',
        },
        { role: 'assistant', content: answer },
        { role: 'user', content: previousError },
        { role: 'user', content: prompt },
      ].filter((m) => m.content) as any[]
    )

    job.log('Response: ' + response)

    const json =
      response
        .match(/```json(.|\n)*```/)?.[0]
        ?.replace(/```json|```/g, '')
        .trim() || '{}'

    try {
      const parsedJson = json ? JSON.parse(json) : {} // we want to make sure it's valid JSON- otherwise we'll get an error which will trigger a new retry
      return JSON.stringify(parsedJson, null, 2)
    } catch (error) {
      job.updateData({
        ...job.data,
        answer: json,
        previousError: error.message,
      })
    }
  },
  {
    concurrency: 10,
    connection: redis,
    autorun: false,
  }
)

export default worker
