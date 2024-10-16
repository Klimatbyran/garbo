import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { ChromaClient } from 'chromadb'
import { OpenAIEmbeddingFunction } from 'chromadb'
import { searchVectors } from '../queues'
import chromadb from '../config/chromadb'
import openai from '../config/openai'
import discord from '../discord'
import { DiscordWorker, DiscordJob } from '../lib/DiscordWorker'

class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    paragraphs: string[]
    markdown: boolean
    pdfHash: string
  }
}

const worker = new DiscordWorker('indexParagraphs', async (job: JobData) => {
  const client = new ChromaClient(chromadb)

  const { paragraphs, url, markdown = false, threadId } = job.data

  await job.sendMessage(`🤖 Sparar i vektordatabas...`)
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
      .then((r) => r?.ids?.length > 0)

    if (exists) {
      job.log('Collection exists. Skipping reindexing.')
      job.editMessage(`✅ Detta dokument fanns redan i vektordatabasen`)
    } else {
      job.log('Indexing ' + paragraphs.length + ' paragraphs...')
      const cleanedParagraphs = paragraphs.filter((p) => p.trim().length > 0)

      const ids = cleanedParagraphs.map((p, i) => job.data.url + '#' + i)
      const metadatas = cleanedParagraphs.map((p, i) => ({
        source: url,
        markdown,
        type: 'company_sustainability_report',
        parsed: new Date().toISOString(),
        page: i,
      }))
      await collection.add({
        ids,
        metadatas,
        documents: cleanedParagraphs,
      })
      job.editMessage(`✅ Sparad i vektordatabasen`)
      job.log('Done!')
    }

    searchVectors.add('search ' + url, {
      // we arent just resending job.data here because it's too much data- we are now relying on the db
      url,
      threadId,
      markdown,
      pdfHash: job.data.pdfHash,
    })

    return paragraphs
  } catch (error) {
    job.log('Error: ' + error)
    job.editMessage(
      `❌ Ett fel uppstod när vektordatabasen skulle nås: ${error}`
    )
    throw error
  }
})

export default worker
