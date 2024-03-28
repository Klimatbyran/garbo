import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { ChromaClient } from 'chromadb'
import { OpenAIEmbeddingFunction } from 'chromadb'
import { indexParagraphs, searchVectors } from '../queues'
import { cleanCollectionName } from '../lib/cleaners'
import chromadb from '../config/chromadb'
import openai from '../config/openai'
import discord from '../discord'
import { TextChannel } from 'discord.js'

class JobData extends Job {
  data: {
    paragraphs: string[]
    url: string
    channelId: string
    messageId: string
    pdfHash: string
  }
}

const worker = new Worker(
  'indexParagraphs',
  async (job: JobData) => {
    const client = new ChromaClient(chromadb)

    const paragraphs = job.data.paragraphs
    const url = job.data.url
    const channel = (await discord.client.channels.fetch(
      job.data.channelId
    )) as TextChannel
    const message = await channel.messages.fetch(job.data.messageId)
    await message.edit(`Sparar i vektordatabas...`)
    job.log('Indexing ' + paragraphs.length + ' paragraphs from url: ' + url)
    const embedder = new OpenAIEmbeddingFunction(openai)

    const collection = await client.getOrCreateCollection({
      name: cleanCollectionName(url),
      embeddingFunction: embedder,
    })

    const ids = paragraphs.map((p, i) => job.data.url + '#' + i)
    const metadatas = paragraphs.map((p, i) => ({
      source: url,
      type: 'company_sustainability_report',
      parsed: new Date().toISOString(),
      page: i,
    }))
    const documents = paragraphs.map((p) => p)
    await collection.add({
      ids,
      metadatas,
      documents,
    })

    searchVectors.add('search ' + url, {
      url,
      channelId: job.data.channelId,
      messageId: job.data.messageId,
      pdfHash: job.data.pdfHash,
    })

    return paragraphs
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
