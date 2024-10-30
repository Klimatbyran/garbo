import { Queue, QueueOptions } from 'bullmq'
import redis from '../config/redis'

const options: QueueOptions = {
  connection: redis,
  defaultJobOptions: { removeOnComplete: false },
}

function createQueue(name: string) {
  return new Queue(name, options)
}

const downloadPDF = createQueue('downloadPDF')
const pdf2Markdown = createQueue('pdf2Markdown')
const splitText = createQueue('splitText')
const indexParagraphs = createQueue('indexParagraphs')
const searchVectors = createQueue('searchVectors')
const guessWikidata = createQueue('guessWikidata')
const extractEmissions = createQueue('extractEmissions')
const followUp = createQueue('followUp')
const precheck = createQueue('precheck')
const saveToAPI = createQueue('saveToAPI')
const checkDB = createQueue('checkDB')

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
