import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { ChromaClient } from 'chromadb'
import { OpenAIEmbeddingFunction } from 'chromadb'
import { parseText } from '../queues'
import { cleanCollectionName } from '../lib/cleaners'
import chromadb from '../config/chromadb'

const embedder = new OpenAIEmbeddingFunction({
  openai_api_key: process.env.OPENAI_API_KEY,
})

class JobData extends Job {
  data: {
    url: string
  }
}

const worker = new Worker(
  'searchVectors',
  async (job: JobData) => {
    const client = new ChromaClient(chromadb)
    const url = job.data.url

    job.log('Searching ' + url)

    const collection = await client.getCollection({
      name: cleanCollectionName(url),
      embeddingFunction: embedder,
    })

    const results = await collection.query({
      nResults: 5,
      queryTexts: [
        'GHG accounting, tCO2e (location-based method), ton CO2e, scope, scope 1, scope 2, scope 3, co2, emissions, emissions, 2021, 2023, 2022, gri protocol, CO2, ghg, greenhouse, gas, climate, change, global, warming, carbon, ',
      ],
    })

    job.log(JSON.stringify(results))

    parseText.add(
      'parse ' + url,
      {
        url,
        paragraphs: results.documents.flat(),
      },
      {
        attempts: 5,
      }
    )

    return results.documents
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
