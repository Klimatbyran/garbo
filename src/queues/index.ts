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
const followUp = new Queue('followUp', options)
const precheck = new Queue('precheck', options)
const saveToAPI = new Queue('saveToAPI', options)
const checkDB = new Queue('checkDB', options)

export {
  downloadPDF,
  pdf2Markdown,
  splitText,
  indexParagraphs,
  searchVectors,
  precheck,
  guessWikidata,
  extractEmissions,
  followUp,
  saveToAPI,
  checkDB,
}
