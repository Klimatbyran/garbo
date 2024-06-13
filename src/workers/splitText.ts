import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { indexParagraphs } from '../queues'
import discord from '../discord'

class JobData extends Job {
  data: {
    url: string
    markdown: boolean
    text: string
    threadId: string
    pdfHash: string
  }
}

const worker = new Worker(
  'splitText',
  async (job: JobData) => {
    const { text, markdown = false } = job.data

    job.log(`Splitting text: ${text.slice(0, 20)}`)

    const paragraphs = text.split('\n\n').filter((p) => p.trim().length > 0)

    await discord.sendMessage(
      job.data,
      `✅ Uppdelad i ${paragraphs.length} paragrafer...`
    )

    indexParagraphs.add(
      'found ' + paragraphs.length,
      {
        ...job.data,
        paragraphs,
      },
      {
        attempts: 3,
      }
    )

    job.log(`found ${paragraphs.length} paragraphs`)

    return paragraphs
  },
  {
    concurrency: 100,
    connection: redis,
  }
)

export default worker
