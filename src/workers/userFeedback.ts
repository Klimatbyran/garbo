import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import previousPrompt from '../prompts/parsePDF'
import discord from '../discord'
import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb'
import chromadb from '../config/chromadb'
import { discordReview } from '../queues'
import prompt from '../prompts/feedback'
import { ask } from '../openai'

const embedder = new OpenAIEmbeddingFunction({
  openai_api_key: process.env.OPENAI_API_KEY,
})

class JobData extends Job {
  declare data: {
    documentId: string
    url: string
    json: string
    threadId: string
    feedback: string
  }
}

const worker = new Worker(
  'userFeedback',
  async (job: JobData) => {
    const { feedback, url, json: previousJson } = job.data

    discord.sendMessage(
      job.data,
      `🎯 Feedback: ${feedback} ${job.attemptsStarted || ''}`
    )
    const client = new ChromaClient(chromadb)
    const collection = await client.getCollection({
      name: 'emission_reports',
      embeddingFunction: embedder,
    })

    const results = await collection.query({
      nResults: 3,
      where: {
        // TODO: add markdown here?
        source: url,
      },
      queryTexts: [
        'GHG accounting, tCO2e (location-based method), ton CO2e, scope, scope 1, scope 2, scope 3, co2, emissions, emissions, 2021, 2023, 2022, gri protocol, CO2, ghg, greenhouse, gas, climate, change, global, warming, carbon, växthusgaser, utsläpp, basår, koldioxidutsläpp, koldioxid, klimatmål',
        feedback,
      ],
    })
    const pdfParagraphs = results.documents.flat()

    job.log(`Reflecting on: 
    ${feedback}
    Context:
    ${pdfParagraphs.join('\n\n')}`)

    const response = await ask([
      {
        role: 'system',
        content:
          'You are an expert in CSRD reporting and GHG protocol. Be consise and accurate.',
      },
      { role: 'user', content: 'Previous prompt: ' + previousPrompt },
      { role: 'assistant', content: previousJson },
      {
        role: 'user',
        content: 'Additional context from PDF:' + pdfParagraphs.join('\n\n'),
      },
      { role: 'user', content: feedback },
      {
        role: 'user',
        content: prompt,
      },
    ])

    job.log('Response: ' + response)

    const json =
      response
        .match(/```json(.|\n)*```/)?.[0] // ask is not using json mode so we need to handle json markdown ourselves
        ?.replace(/```json|```/g, '')
        .trim() || '{}'

    const parsedJson = json ? JSON.parse(json) : {} // we want to make sure it's valid JSON- otherwise we'll get an error which will trigger a new retry

    discord.sendMessage(
      job.data,
      json ? response.replace(json, '...json...') : response
    )

    if (Object.keys(parsedJson)) {
      job.log('Parsed JSON: ' + JSON.stringify(parsedJson, null, 2))

      if (parsedJson.agentResponse)
        await discord.sendMessage(job.data, parsedJson.agentResponse)
      if (parsedJson.reviewComment)
        await discord.sendMessage(job.data, parsedJson.reviewComment)

      discordReview.add(job.name, {
        ...job.data,
        json: JSON.stringify(parsedJson, null, 2),
      })
    }
    job.log('Sent to thread' + job.data.threadId)

    return json
  },
  {
    concurrency: 10,
    connection: redis,
  }
)

export default worker
