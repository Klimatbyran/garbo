import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { ChromaClient } from 'chromadb'
import { OpenAIEmbeddingFunction } from 'chromadb'
import { guessWikidata } from '../queues'
import { DiscordWorker, DiscordJob } from '../lib/DiscordWorker'
import chromadb from '../config/chromadb'
import discord from '../discord'
import prompt from '../prompts/parsePDF'

const embedder = new OpenAIEmbeddingFunction({
  openai_api_key: process.env.OPENAI_API_KEY,
})

class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    markdown: boolean
  }
}

const worker = new DiscordWorker('searchVectors', async (job: JobData) => {
  const client = new ChromaClient(chromadb)
  const { url, markdown = false } = job.data

  job.log('Searching ' + url)

  await job.sendMessage('🤖 Söker upp utsläppsdata...')

  const collection = await client.getCollection({
    name: 'emission_reports',
    embeddingFunction: embedder,
  })

  const results = await collection.query({
    nResults: markdown ? 20 : 5,
    where: markdown
      ? { $and: [{ source: url }, { markdown }] }
      : { source: url },
    queryTexts: [
      prompt,
      'GHG accounting, tCO2e (location-based method), ton CO2e, scope, scope 1, scope 2, scope 3, co2, emissions, emissions, 2021, 2023, 2022, gri protocol, CO2, ghg, greenhouse, gas, climate, change, global, warming, carbon, växthusgaser, utsläpp, basår, koldioxidutsläpp, koldioxid, klimatmål',
    ],
  })

  const paragraphs = results.documents?.flat() || []

  if (paragraphs.length === 0) {
    job.editMessage('❌ Hittade inga relevanta paragrafer.')
    return results.documents
  }

  job.log('Paragraphs:\n\n' + paragraphs.join('\n\n'))

  job.editMessage('✅ Hittade ' + paragraphs.length + ' relevanta paragrafer.')

  guessWikidata.add(
    'guess ' + url.slice(-20),
    {
      url,
      companyName: url,
      paragraphs,
      previousAnswer: '',
      answer: '',
      threadId: job.data.threadId,
    },
    {
      attempts: 5,
    }
  )

  return results.documents
})

export default worker
