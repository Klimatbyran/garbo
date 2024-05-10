import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import elastic from '../elastic'
import discord from '../discord'

class JobData extends Job {
  data: {
    documentId: string
    pdfHash: string
    state: string
    threadId: string
    report: string
  }
}

const worker = new Worker(
  'saveToDb',
  async (job: JobData) => {
    const { documentId, pdfHash, state, report } = job.data
    job.updateProgress(10)
    const message = await discord.sendMessage(
      job.data,
      `Sparar till databasen..`
    )
    if (report && JSON.parse(report).emissions.length > 0) {
      job.log(`Saving report to db: ${documentId}`)
      job.updateProgress(20)
      await elastic.indexReport(documentId, pdfHash, report)
      message?.edit(`✅ Sparad!`)
    }
    if (state) {
      job.log(`Updating report state: ${state} #${documentId}`)
      job.updateProgress(30)
      await elastic.updateDocumentState(documentId, state)
      message?.edit(`✅ Sparad: ${state}!`)
    }
    job.updateProgress(100)
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
