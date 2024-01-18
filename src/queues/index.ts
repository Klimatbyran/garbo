import { Queue } from 'bullmq'
import redis from '../config/redis'

const options = {
  connection: redis,
  defaultJobOptions: { removeOnComplete: false },
}

const downloadPDF = new Queue('downloadPDF', options)
const parseText = new Queue('parseText', options)
const splitText = new Queue('splitText', options)

export { downloadPDF, parseText, splitText }
