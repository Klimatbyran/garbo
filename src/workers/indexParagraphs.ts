import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { ChromaClient } from 'chromadb'
import { OpenAIEmbeddingFunction } from 'chromadb'
import { indexParagraphs, searchVectors } from '../queues'

class JobData extends Job {
  data: {
    paragraphs: string[]
    url: string
  }
}

const worker = new Worker(
  'indexParagraphs',
  async (job: JobData) => {
    const client = new ChromaClient()
    const paragraphs = job.data.paragraphs
    const url = job.data.url
    job.log('Indexing ' + paragraphs.length + ' paragraphs from url: ' + url)
    const embedder = new OpenAIEmbeddingFunction({
      openai_api_key: process.env.OPENAI_API_KEY,
    })
    console.log('OPENAI KEY', process.env.OPENAI_API_KEY)

    const collection = await client.getOrCreateCollection({
      name: url,
      embeddingFunction: embedder,
    })

    await collection.add({
      ids: paragraphs.map((p, i) => job.data.url + '#' + i),
      metadatas: paragraphs.map((p, i) => ({
        source: url,
        parsed: new Date().toISOString(),
        page: i,
      })),
      documents: paragraphs.map((p) => p),
    })

    searchVectors.add('search ' + url, {
      url,
    })

    return paragraphs
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
