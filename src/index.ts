import express from 'express'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import dotenv from 'dotenv'
dotenv.config()

// keep this line, otherwise the workers won't be started
import workers from './workers'
import { downloadPDF, parseText } from './queues'

// add dummy job
downloadPDF.add('dummy', {
  url: 'https://www.icagruppen.se/globalassets/3.-investerare/5.-rapporter/arkiv---finansiellt/svenska/arkiv/2022/02.-arsredovisning-2021/icagruppen-arsredovisning-2021.pdf',
})

// start workers
workers.forEach((worker) => worker.run())

// start ui
const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

createBullBoard({
  queues: [new BullMQAdapter(parseText), new BullMQAdapter(downloadPDF)],
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
