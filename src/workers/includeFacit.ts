import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { searchCompany } from '../lib/wikidata'
import { ask, askPrompt } from '../openai'
import { findFacit } from '../lib/facit'

class JobData extends Job {
  declare data: {
    url: string
    companyName: string
    previousAnswer: string
    answer: string
    threadId: string
    previousError: string
  }
}
const worker = new Worker(
  'includeFacit',
  async (job: JobData) => {
    const facit = await findFacit(job.data.url || job.data.companyName).catch(
      (error) => null
    )
    job.log('Found facit: ' + JSON.stringify(facit, null, 2))

    if (!facit) {
      return JSON.stringify({ facit: { error: 'No facit found' } }, null, 2)
    }

    return JSON.stringify({ facit: facit }, null, 2)
  },
  {
    concurrency: 10,
    connection: redis,
  }
)

export default worker
