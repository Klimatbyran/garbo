import express from 'express'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import dotenv from 'dotenv'
dotenv.config()

// keep this line, otherwise the workers won't be started
import * as workers from './workers'
import {
  downloadPDF,
  indexParagraphs,
  parseText,
  searchVectors,
  splitText,
} from './queues'

// add dummy job
downloadPDF.add('dummy', {
  url: 'https://mb.cision.com/Main/17348/3740648/1941181.pdf',
})

// start workers
Object.values(workers).forEach((worker) => worker.run())

// start ui
const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

createBullBoard({
  queues: [
    new BullMQAdapter(parseText),
    new BullMQAdapter(downloadPDF),
    new BullMQAdapter(indexParagraphs),
    new BullMQAdapter(searchVectors),
  ],
  serverAdapter: serverAdapter,
  options: {
    uiConfig: {
      boardTitle: 'Klimatkollen',
    },
  },
})

const app = express()

app.use('/admin/queues', serverAdapter.getRouter())
app.listen(3000, () => {
  console.log('Running on 3000...')
  console.log('For the UI, open http://localhost:3000/admin/queues')
})
