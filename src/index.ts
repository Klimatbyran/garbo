import express from 'express'
import { Queue, Worker } from 'bullmq'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import redis from './config/redis'

// keep this line, otherwise the workers won't be started
import workers from './workers'

const removeOnComplete = {
  connection: redis,
  defaultJobOptions: { removeOnComplete: false },
}
const readPDF = new Queue('readPDF', removeOnComplete)
const downloadPDF = new Queue('downloadPDF', removeOnComplete)

// add some example jobs
downloadPDF.add('dummy', {
  url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
})

// start workers

workers.forEach((worker) => worker.run())

// start ui

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [new BullMQAdapter(readPDF), new BullMQAdapter(downloadPDF)],
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
  console.log(`Redis is reached at ${redis.host} on port ${redis.port}`)
})
