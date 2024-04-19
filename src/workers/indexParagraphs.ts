import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { ChromaClient } from 'chromadb'
import { OpenAIEmbeddingFunction } from 'chromadb'
import { indexParagraphs, searchVectors } from '../queues'
import chromadb from '../config/chromadb'
import openai from '../config/openai'
import discord from '../discord'
import { TextChannel } from 'discord.js'

class JobData extends Job {
  data: {
    paragraphs: string[]
    url: string
    channelId: string
    markdown: boolean
    messageId: string
    pdfHash: string
  }
}

const worker = new Worker(
  'indexParagraphs',
  async (job: JobData) => {
    const client = new ChromaClient(chromadb)

    const {
      paragraphs,
      url,
      channelId,
      markdown = false,
      messageId,
      pdfHash,
    } = job.data

    await discord.editMessage(job.data, `Sparar i vektordatabas...`)
    job.log('Indexing ' + paragraphs.length + ' paragraphs from url: ' + url)
    const embedder = new OpenAIEmbeddingFunction(openai)

    const collection = await client.getOrCreateCollection({
      name: 'emission_reports',
      embeddingFunction: embedder,
    })
    const exists = await collection
      .get({
        where: {
          source: url,
          markdown,
        },
      })
      .then((r) => r?.documents?.length > 0)

    if (exists) {
      job.log('Collection exists. Skipping reindexing.')
    } else {
      job.log('Indexing ' + paragraphs.length + ' paragraphs...')

      const ids = paragraphs.map((p, i) => job.data.url + '#' + i)
      const metadatas = paragraphs.map((p, i) => ({
        source: url,
        markdown,
        type: 'company_sustainability_report',
        parsed: new Date().toISOString(),
        page: i,
      }))
      await collection.add({
        ids,
        metadatas,
        documents: paragraphs,
      })
      job.log('Done!')
    }

    searchVectors.add('search ' + url, {
      url,
      channelId,
      messageId,
      pdfHash,
    })

    return paragraphs
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
