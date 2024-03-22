import dotenv from 'dotenv'
dotenv.config() // keep this line first in file

import express from 'express'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import fs from 'fs/promises'

import discord from './discord'

// keep this line, otherwise the workers won't be started
import * as workers from './workers'
import {
  discordReview,
  downloadPDF,
  indexParagraphs,
  parseText,
  reflectOnAnswer,
  searchVectors,
  splitText,
} from './queues'
import { scope2Image } from './lib/imageCreator'
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
    new BullMQAdapter(splitText),
    new BullMQAdapter(indexParagraphs),
    new BullMQAdapter(searchVectors),
    new BullMQAdapter(parseText),
    new BullMQAdapter(reflectOnAnswer),
    new BullMQAdapter(discordReview),
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

app.use('/api', companyRoutes);
app.use('/admin/queues', serverAdapter.getRouter())
app.listen(3000, () => {
  console.log('Running on 3000...')
  console.log('For the UI, open http://localhost:3000/admin/queues')
})

app.get('/', (req, res) => {
  res.send(`Hi I'm Garbo!`)
})

app.get(`/api/companies`, async function (req, res) {
  res.writeHead(200, { 'Content-Type': 'image/png' })
  const exampleString = (
    await fs.readFile('./src/data/example.json')
  ).toString()
  console.log('exampleString', exampleString)
  const example = JSON.parse(exampleString)
  const image = await scope2Image(example)
  res.end(image, 'binary')
})
