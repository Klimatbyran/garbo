import 'dotenv/config'

import express from 'express'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'

import discord from './discord'
import opensearch from './opensearch'

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
  saveToDb,
  followUp,
  guessWikidata,
  format,
  includeFacit,
} from './queues'
import companyRoutes from './routes/companyRoutes'

// start ui
const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

async function restartActiveJobs(queue) {
  const jobCounts = await queue.getJobCounts()
  if (jobCounts.active > 0) {
    const activeJobs = await queue.getJobs(['active'])
    for (const job of activeJobs) {
      await job.moveToFailed(new Error('Restarting active job'), true)
      await job.retry()
    }
  }
}

const queues = [
  downloadPDF,
  pdf2Markdown,
  splitText,
  indexParagraphs,
  searchVectors,
  extractEmissions,
  followUp,
  includeFacit,
  reflectOnAnswer,
  format,
  discordReview,
  userFeedback,
  saveToDb,
  guessWikidata,
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
opensearch.setupIndices()

app.use('/api', companyRoutes)
app.use('/admin/queues', serverAdapter.getRouter())
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Running on ${port}...`)
  console.log(`For the UI, open http://localhost:${port}/admin/queues`)
})

// move active jobs to failed and retry
// this is a temporary hack to speed up process for now

app.get('/admin/restart-active-jobs', async (req, res) => {
  queues.map((queue) => {
    try {
      restartActiveJobs(queue)
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
