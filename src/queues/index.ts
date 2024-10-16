import { Queue, QueueOptions } from 'bullmq'
import redis from '../config/redis'

const options: QueueOptions = {
  connection: redis,
  defaultJobOptions: { removeOnComplete: false },
}

const downloadPDF = new Queue('downloadPDF', options)
const pdf2Markdown = new Queue('pdf2Markdown', options)
const splitText = new Queue('splitText', options)
const indexParagraphs = new Queue('indexParagraphs', options)
const searchVectors = new Queue('searchVectors', options)
const guessWikidata = new Queue('guessWikidata', options)
const extractEmissions = new Queue('extractEmissions', options)
const reflectOnAnswer = new Queue('reflectOnAnswer', options)
const followUp = new Queue('followUp', options)
const discordReview = new Queue('discordReview', options)
const userFeedback = new Queue('userFeedback', options)
const precheck = new Queue('precheck', options)

export {
  downloadPDF,
  pdf2Markdown,
  splitText,
  indexParagraphs,
  searchVectors,
  precheck,
  guessWikidata,
  extractEmissions,
  reflectOnAnswer,
  followUp,
  discordReview,
  userFeedback,
}
