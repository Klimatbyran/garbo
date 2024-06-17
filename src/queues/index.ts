import { Queue, QueueOptions } from 'bullmq'
import redis from '../config/redis'

const options: QueueOptions = {
  connection: redis,
  defaultJobOptions: { removeOnComplete: false },
}

const downloadPDF = new Queue('downloadPDF', options)
const pdf2Markdown = new Queue('pdf2Markdown', options)
const extractEmissions = new Queue('extractEmissions', options)
const splitText = new Queue('splitText', options)
const indexParagraphs = new Queue('indexParagraphs', options)
const searchVectors = new Queue('searchVectors', options)
const reflectOnAnswer = new Queue('reflectOnAnswer', options)
const format = new Queue('format', options)
const discordReview = new Queue('discordReview', options)
const userFeedback = new Queue('userFeedback', options)
const saveToDb = new Queue('saveToDb', options)
const followUp = new Queue('followUp', options)
const guessWikidata = new Queue('guessWikidata', options)
const includeFacit = new Queue('includeFacit', options)

export {
  downloadPDF,
  pdf2Markdown,
  splitText,
  indexParagraphs,
  searchVectors,
  extractEmissions,
  followUp,
  reflectOnAnswer,
  format,
  discordReview,
  includeFacit,
  userFeedback,
  saveToDb,
  guessWikidata,
}
