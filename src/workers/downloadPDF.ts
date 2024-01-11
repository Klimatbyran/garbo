import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import pdf from 'pdf-parse'

class JobData extends Job {
  data: {
    url: string
  }
}

const worker = new Worker(
  'downloadPDF',
  async (job: JobData) => {
    job.log(`Downloading from url: ${job.data.url}`)

    const buffer = await fetch(job.data.url).then((res) => res.arrayBuffer())
    const doc = await pdf(buffer)
    return doc.text
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
