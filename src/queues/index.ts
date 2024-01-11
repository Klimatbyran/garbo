import { Queue } from 'bullmq'
import redis from '../config/redis'

const options = {
  connection: redis,
  defaultJobOptions: { removeOnComplete: false },
}

const downloadPDF = new Queue('downloadPDF', options)
const parseText = new Queue('parseText', options)

export { downloadPDF, parseText }
