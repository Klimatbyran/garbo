import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { ChromaClient } from 'chromadb'
import { OpenAIEmbeddingFunction } from 'chromadb'
import { parseText } from '../queues'
import chromadb from '../config/chromadb'
import discord from '../discord'
import { TextChannel } from 'discord.js'

const embedder = new OpenAIEmbeddingFunction({
  openai_api_key: process.env.OPENAI_API_KEY,
})

const editMessage = async (
  channelId: string,
  messageId: string,
  text: string
) => {
  const channel = (await discord.client.channels.fetch(
    channelId
  )) as TextChannel
  const message = await channel.messages.fetch(messageId)
  await message?.edit(text)
}

class JobData extends Job {
  data: {
    url: string
    channelId: string
    markdown: boolean
    messageId: string
    pdfHash: string
  }
}

const worker = new Worker(
  'searchVectors',
  async (job: JobData) => {
    const client = new ChromaClient(chromadb)
    const { url, markdown = false, channelId, messageId, pdfHash } = job.data

    job.log('Searching ' + url)

    editMessage(channelId, messageId, 'Hämtar ut utsläppsdata...')

    const collection = await client.getCollection({
      name: 'emission_reports',
      embeddingFunction: embedder,
    })

    const results = await collection.query({
      nResults: 10,
      where: {
        source: url,
        markdown,
      },
      queryTexts: [
        'GHG accounting, tCO2e (location-based method), ton CO2e, scope, scope 1, scope 2, scope 3, co2, emissions, emissions, 2021, 2023, 2022, gri protocol, CO2, ghg, greenhouse, gas, climate, change, global, warming, carbon, växthusgaser, utsläpp, basår, koldioxidutsläpp, koldioxid, klimatmål',
      ],
    })

    job.log(JSON.stringify(results))

    parseText.add(
      'parse ' + url,
      {
        url,
        paragraphs: results.documents.flat(),
        channelId,
        messageId,
        pdfHash,
      },
      {
        attempts: 5,
      }
    )

    return results.documents
  },
  {
    concurrency: 10,
    connection: redis,
    autorun: false,
  }
)

export default worker
