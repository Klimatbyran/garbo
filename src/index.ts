import 'dotenv/config'
import express from 'express'
import { serverAdapter, queues, cancelActiveJobs } from './queue'

import discord from './discord'
import apiRouter from './api'

// start ui

const app = express()
discord.login()

app.get('/favicon.ico', (req, res) => {
  res.status(204).end()
})

app.use(apiRouter)
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
