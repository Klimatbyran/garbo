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

createBullBoard({
  queues: [
    new BullMQAdapter(downloadPDF),
    new BullMQAdapter(pdf2Markdown),
    new BullMQAdapter(splitText),
    new BullMQAdapter(indexParagraphs),
    new BullMQAdapter(searchVectors),
    new BullMQAdapter(extractEmissions),
    new BullMQAdapter(followUp),
    new BullMQAdapter(includeFacit),
    new BullMQAdapter(reflectOnAnswer),
    new BullMQAdapter(format),
    new BullMQAdapter(discordReview),
    new BullMQAdapter(userFeedback),
    new BullMQAdapter(saveToDb),
    new BullMQAdapter(guessWikidata),
  ],
  serverAdapter: serverAdapter,
  options: {
    uiConfig: {
      boardTitle: 'Klimatkollen',
    },
  },
})

// manually restart jobs if they are in active state when we restart the server
// todo: add a button to the UI to restart active jobs per queue
restartActiveJobs(downloadPDF)
restartActiveJobs(pdf2Markdown)
restartActiveJobs(splitText)
restartActiveJobs(indexParagraphs)
restartActiveJobs(searchVectors)
restartActiveJobs(extractEmissions)
restartActiveJobs(followUp)
restartActiveJobs(includeFacit)
restartActiveJobs(reflectOnAnswer)
restartActiveJobs(format)
restartActiveJobs(discordReview)
restartActiveJobs(userFeedback)
restartActiveJobs(saveToDb)
restartActiveJobs(guessWikidata)

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

app.get('/', (req, res) => {
  res.send(
    `Hi I'm Garbo! Queues: <br><a href="/admin/queues">/admin/queues</a>`
  )
})
