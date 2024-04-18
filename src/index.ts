import dotenv from 'dotenv'
dotenv.config() // keep this line first in file

import express from 'express'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import fs from 'fs/promises'

import discord from './discord'
import elastic from './elastic'

// keep this line, otherwise the workers won't be started
import * as workers from './workers'
import {
  discordReview,
  downloadPDF,
  indexParagraphs,
  pdf2Markdown,
  parseText,
  reflectOnAnswer,
  searchVectors,
  splitText,
  userFeedback,
} from './queues'
import { summaryTable, scope3Table } from './lib/discordTable'
import companyRoutes from './routes/companyRoutes'

// add dummy job
// downloadPDF.add('dummy', {
//   url: 'https://mb.cision.com/Main/17348/3740648/1941181.pdf',
// })

/*
downloadPDF.add('volvo', {
  url: 'https://www.volvogroup.com/content/dam/volvo-group/markets/master/investors/reports-and-presentations/annual-reports/AB-Volvo-Annual-Report-2022.pdf',
})*/

// start workers
Object.values(workers).forEach((worker) => worker.run())

// start ui
const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

createBullBoard({
  queues: [
    new BullMQAdapter(downloadPDF),
    new BullMQAdapter(pdf2Markdown),
    new BullMQAdapter(splitText),
    new BullMQAdapter(indexParagraphs),
    new BullMQAdapter(searchVectors),
    new BullMQAdapter(parseText),
    new BullMQAdapter(reflectOnAnswer),
    new BullMQAdapter(discordReview),
    new BullMQAdapter(userFeedback),
  ],
  serverAdapter: serverAdapter,
  options: {
    uiConfig: {
      boardTitle: 'Klimatkollen',
    },
  },
})

const app = express()
discord.login()
elastic.setupIndices()

app.use('/api', companyRoutes)
app.use('/admin/queues', serverAdapter.getRouter())
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Running on ${port}...`)
  console.log(`For the UI, open http://localhost:${port}/admin/queues`)
})

app.get('/', (req, res) => {
  res.send(`Hi I'm Garbo!`)
})

app.get('/api/imageFromHtml', async (req, res) => {
  const url = process.env.GOTENBERG_URL || 'http://localhost:3333'
  const response = await fetch(`${url}/forms/chromium/screenshot/html`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      html: '<h1>Hello world</h1>',
    }),
  })
  response.body.pipeThrough(res)
})

app.get(`/api/companies`, async function (req, res) {
  //res.writeHead(200, { 'Content-Type': 'image/png' })
  const exampleString = (
    await fs.readFile('./src/data/example.json')
  ).toString()
  console.log('exampleString', exampleString)
  const example = JSON.parse(exampleString)
  const scope2 = await summaryTable(example)
  const scope3 = await scope3Table(example)
  res.end(scope2 + '\n' + scope3)
})
