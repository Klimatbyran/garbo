import 'dotenv/config'
import express from 'express'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import { Queue } from 'bullmq'
import pino from 'pino-http'

import discord from './discord'
import {
  discordReview,
  downloadPDF,
  indexParagraphs,
  pdf2Markdown,
  extractEmissions,
  reflectOnAnswer,
  searchVectors,
  splitText,
  userFeedback,
  followUp,
  precheck,
  guessWikidata,
  saveToAPI,
  checkDB,
} from './queues'
import readCompanies from './routes/readCompanies'
import updateCompanies from './routes/updateCompanies'
import { errorHandler } from './routes/middlewares'

// start ui
const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

async function cancelActiveJobs(queue: Queue) {
  const jobCounts = await queue.getActiveCount()
  if (jobCounts > 0) {
    const activeJobs = await queue.getActive()
    for (const job of activeJobs) {
      try {
        await job.moveToFailed(new Error('Cancelling active job'), queue.token)
        // await job.retry()
      } catch (e) {
        console.error(e)
      }
    }
  }
}

const queues = [
  downloadPDF,
  pdf2Markdown,
  splitText,
  indexParagraphs,
  searchVectors,
  precheck,
  guessWikidata,
  extractEmissions,
  followUp,
  reflectOnAnswer,
  discordReview,
  userFeedback,
  checkDB,
  saveToAPI,
]
createBullBoard({
  queues: queues.map((queue) => new BullMQAdapter(queue)),
  serverAdapter: serverAdapter,
  options: {
    uiConfig: {
      boardTitle: 'Klimatkollen',
    },
  },
})

const app = express()
discord.login()

app.get('/favicon.ico', (req, res) => {
  res.status(204).end()
})

app.use(
  '/api',
  pino(
    process.stdin.isTTY
      ? {
          transport: {
            target: 'pino-pretty',
          },
          level: 'info',
        }
      : undefined
  )
)

app.use('/api/companies', readCompanies)
app.use('/api/companies', updateCompanies)
app.use('/admin/queues', serverAdapter.getRouter())

// move active jobs to failed and retry
// this is a temporary hack to speed up process for now

app.get('/admin/cancel-active-jobs', async (req, res) => {
  queues.map((queue) => {
    try {
      cancelActiveJobs(queue)
    } catch (e) {
      console.error(e)
    }
  })
  res.send('Restarting active jobs')
})

app.get('/', (req, res) => {
  res.send(
    `Hi I'm Garbo! Queues: <br><a href="/admin/queues">/admin/queues</a>`
  )
})

// TODO: Why does this error handler not capture errors thrown in readCompanies?
app.use(errorHandler)

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Running on ${port}...`)
  console.log(`For the UI, open http://localhost:${port}/admin/queues`)
})
