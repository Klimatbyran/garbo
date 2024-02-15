import { Queue, QueueOptions } from 'bullmq'
import redis from '../config/redis'

const options: QueueOptions = {
  connection: redis,
  defaultJobOptions: { removeOnComplete: false },
}

const downloadPDF = new Queue('downloadPDF', options)
const crawlURL = new Queue('crawlURL', options)
const parseText = new Queue('parseText', options)
const splitText = new Queue('splitText', options)
const indexParagraphs = new Queue('indexParagraphs', options)
const searchVectors = new Queue('searchVectors', options)
const reflectOnAnswer = new Queue('reflectOnAnswer', options)
const discordReview = new Queue('discordReview', options)
const testStep1Queue = new Queue('testStep1Queue', options);
const testStep2Queue = new Queue('testStep2Queue', options);
const createEmissionsImageQueue = new Queue('createEmissionsImage', options);
const askManualReviewQueue = new Queue('askManualReview', options);
const saveToDBQueue = new Queue('saveToDB', options);

export {
  downloadPDF,
  crawlURL,
  parseText,
  splitText,
  indexParagraphs,
  searchVectors,
  reflectOnAnswer,
  discordReview,
  testStep1Queue,
  testStep2Queue,
  createEmissionsImageQueue,
  askManualReviewQueue,
  saveToDBQueue,
}
