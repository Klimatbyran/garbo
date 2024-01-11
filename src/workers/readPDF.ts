import { Worker, Job } from 'bullmq'
import redis from '../config/redis'

const worker = new Worker(
  'readPDF',
  async (job: Job) => {
    // Optionally report some progress
    await job.updateProgress(42)

    // Optionally sending an object as progress
    await job.updateProgress({ foo: 'bar' })

    // Do something with job
    return 'some value'
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
