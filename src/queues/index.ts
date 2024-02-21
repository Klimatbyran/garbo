import { Queue, QueueOptions } from 'bullmq'
import redis from '../config/redis'

const options: QueueOptions = {
  connection: redis,
  defaultJobOptions: { removeOnComplete: false },
}

const checkURL = new Queue('checkURL', options)
const downloadPDF = new Queue('downloadPDF', options)
const downloadWebsite = new Queue('downloadWebsite', options)
const parseText = new Queue('parseText', options)
const splitText = new Queue('splitText', options)
const indexParagraphs = new Queue('indexParagraphs', options)
const searchVectors = new Queue('searchVectors', options)
const reflectOnAnswer = new Queue('reflectOnAnswer', options)
const discordReview = new Queue('discordReview', options)

export {
  checkURL,
  downloadPDF,
  downloadWebsite,
  parseText,
  splitText,
  indexParagraphs,
  searchVectors,
  reflectOnAnswer,
  discordReview,
}
