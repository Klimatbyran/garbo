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
    threadId: string
    markdown: boolean
    pdfHash: string
  }
}

const worker = new Worker(
  'indexParagraphs',
  async (job: JobData) => {
    const client = new ChromaClient(chromadb)

    const { paragraphs, url, markdown = false } = job.data

    const message = await discord.sendMessage(
      job.data,
      `🤖 Sparar i vektordatabas...`
    )
    job.log('Indexing ' + paragraphs.length + ' paragraphs from url: ' + url)
    const embedder = new OpenAIEmbeddingFunction(openai)

    try {
      const collection = await client.getOrCreateCollection({
        name: 'emission_reports',
        embeddingFunction: embedder,
      })
      const exists = await collection
        .get({
          where: markdown
            ? { $and: [{ source: url }, { markdown }] }
            : { source: url },
        })
        .then((r) => r?.documents?.length > 0)

      if (exists) {
        job.log('Collection exists. Skipping reindexing.')
        message.edit(`✅ Detta dokument fanns redan i vektordatabasen`)
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
        message.edit(`✅ Sparad i vektordatabasen`)
        job.log('Done!')
      }

      searchVectors.add('search ' + url, {
        ...job.data,
      })

      return paragraphs
    } catch (error) {
      job.log('Error: ' + error)
      message.edit(
        `❌ Ett fel uppstod när vektordatabasen skulle nås: ${error}`
      )
      throw error
    }
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
