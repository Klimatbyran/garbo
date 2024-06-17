import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import opensearch from '../opensearch'
import discord from '../discord'
import fs from 'fs'

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
    const parsed = report && JSON.parse(report)
    const isNewEntry = parsed?.emissions ? true : false
    if (isNewEntry) {
      job.log(`New report: ${documentId}`)
    }
    if (state) {
      job.log(`Update report state: ${state} #${documentId}`)
    }
    job.updateProgress(10)
    const message = await discord.sendMessage(
      job.data,
      `Sparar till databasen..`
    )
    if (isNewEntry) {
      job.log(`Saving report to db: ${documentId}`)
      job.updateProgress(20)
      console.log('savingg to file', parsed.companyName)
      if (process.env.NODE_ENV === 'development') {
        fs.writeFileSync(
          `../data/${parsed.companyName}.json`,
          JSON.stringify(JSON.parse(report), null, 2)
        )
      } else {
        await opensearch.indexReport(documentId, pdfHash, report)
      }
      job.updateProgress(30)
      message?.edit(`✅ Sparad!`)
    }
    if (state) {
      job.log(`Updating report state: ${state} #${documentId}`)
      job.updateProgress(40)
      if (process.env.NODE_ENV === 'development') {
        console.log('update state', state)
      } else {
        await opensearch.updateDocumentState(documentId, state)
      }
      message?.edit(`✅ Sparad: ${state}!`)
    }
    job.updateProgress(100)
  },
  {
    connection: redis,
  }
)

export default worker
