import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { indexParagraphs } from '../queues'
import discord from '../discord'
import { TextChannel } from 'discord.js'

class JobData extends Job {
  data: {
    url: string
    markdown: boolean
    text: string
    channelId: string
    messageId: string
    pdfHash: string
  }
}

const worker = new Worker(
  'splitText',
  async (job: JobData) => {
    const {
      url,
      text,
      channelId,
      markdown = false,
      messageId,
      pdfHash,
    } = job.data

    job.log(`Splitting text: ${text.slice(0, 20)}`)

    const paragraphs = markdown
      ? text.split('##').filter((p) => p.trim().length > 0)
      : text.split('\n\n').filter((p) => p.trim().length > 0)

    discord.editMessage(job.data, `Bearbetar PDF...`)

    indexParagraphs.add(
      'found ' + paragraphs.length,
      {
        paragraphs,
        url,
        channelId,
        markdown,
        messageId,
        pdfHash,
      },
      {
        attempts: 3,
      }
    )

    job.updateProgress(100)

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
