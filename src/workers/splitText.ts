import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { parseText } from '../queues'
import { parse } from 'dotenv'

class JobData extends Job {
  data: {
    text: string
  }
}

const worker = new Worker(
  'splitText',
  async (job: JobData) => {
    job.log(`Splitting text: ${job.data.text.slice(0, 20)}`)

    const paragraphs = job.data.text.split('\n\n')

    parseText.add('found ' + paragraphs.length, {
      paragraphs,
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
