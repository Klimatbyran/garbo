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

    const paragraphs = markdown
      ? text.split('##').filter((p) => p.trim().length > 0)
      : text.split('\n\n').filter((p) => p.trim().length > 0)

    discord.sendMessage(job.data, `Delar upp i ${paragraphs.length} stycken...`)

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
    autorun: false,
  }
)

export default worker
