import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import pdf from 'pdf-parse'
import { parseText } from '../queues'

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
    const text = doc.text

    parseText.add('parse text ' + text.slice(0, 20), {
      text,
    })

    return doc.text
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
