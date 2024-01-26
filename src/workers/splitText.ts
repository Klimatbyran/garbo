import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { indexParagraphs } from '../queues'
import { parse } from 'dotenv'

class JobData extends Job {
  data: {
    url: string
    text: string
  }
}

const worker = new Worker(
  'splitText',
  async (job: JobData) => {
    job.log(`Splitting text: ${job.data.text.slice(0, 20)}`)

    const paragraphs = job.data.text.split('\n\n').filter((p) => p.length > 0)

    indexParagraphs.add('found ' + paragraphs.length, {
      paragraphs,
      url: job.data.url,
    })

    job.updateProgress(100)

    job.log(`found ${paragraphs.length} paragraphs`)

    return paragraphs
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
