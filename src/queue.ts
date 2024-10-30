import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { Queue } from 'bullmq'
import { initializeQueues } from './queues'

const workers = [
  'downloadPDF',
  'pdf2Markdown',
  'splitText',
  'indexParagraphs',
  'searchVectors',
  'precheck',
  'guessWikidata',
  'extractEmissions',
  'followUp',
  'checkDB',
  'saveToAPI',
]

export const queues = initializeQueues(workers, process.env.REDIS_URL)

export const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

createBullBoard({
  queues: queues.map((queue) => new BullMQAdapter(queue)),
  serverAdapter: serverAdapter,
  options: {
    uiConfig: {
      boardTitle: 'Klimatkollen',
    },
  },
})

export async function cancelActiveJobs(queue: Queue) {
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
