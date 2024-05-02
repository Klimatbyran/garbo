import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import OpenAI from 'openai'
import previousPrompt from '../prompts/reflect'
import discord from '../discord'
import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb'
import chromadb from '../config/chromadb'
import { discordReview } from '../queues'

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
    json: string
    prompt: string
  }
}

const worker = new Worker(
  'followUp',
  async (job: JobData) => {
    const { prompt, url, json: previousJson } = job.data

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
    console.log('RESULTS', results)
    const pdfParagraphs = results.documents.flat()

    console.log('PDF_PARAGRAPHS', pdfParagraphs)
    job.log(`Reflecting on: ${prompt}
    ${previousJson}`)

    const stream = await openai.chat.completions.create({
      messages: [
        { role: 'user', content: pdfParagraphs.join('\n\n') },
        {
          role: 'user',
          content:
            'This is the result of a previous prompt. Please add diffs to the prompt based on the instructions below. For example, if you want to add a new field called "industry" the resulting prompt should look like this: \n\n```json\n{\n "industry": "Industry Y"\n}\n```',
        },
        { role: 'system', content: previousJson },
        { role: 'user', content: prompt },
      ],
      model: 'gpt-4-turbo',
      stream: true,
    })

    let response = ''
    let progress = 0
    try {
      for await (const part of stream) {
        const chunk = part.choices[0]?.delta?.content
        progress += 1
        response += chunk || ''
        job.updateProgress(Math.min(100, (100 * progress) / 400))
      }
    } catch (error) {
      job.log('Error: ' + error)
    }

    job.log('Response: ' + response)

    const json =
      response
        .match(/```json(.|\n)*```/)?.[0]
        ?.replace(/```json|```/g, '')
        .trim() || '{}'
    const parsedJson = json ? JSON.parse(json) : {} // we want to make sure it's valid JSON- otherwise we'll get an error which will trigger a new retry

    return JSON.stringify(parsedJson, null, 2)
  },
  {
    concurrency: 10,
    connection: redis,
    autorun: false,
  }
)

export default worker
