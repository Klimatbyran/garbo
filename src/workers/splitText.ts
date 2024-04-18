import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { indexParagraphs } from '../queues'
import discord from '../discord'
import { TextChannel } from 'discord.js'

class JobData extends Job {
  data: {
    url: string
    text: string
    channelId: string
    messageId: string
    pdfHash: string
  }
}

const worker = new Worker(
  'splitText',
  async (job: JobData) => {
    job.log(`Splitting text: ${job.data.text.slice(0, 20)}`)

    const markdown = job.data.text.replace('##', '\n\n##')
    const paragraphs = markdown.split('\n\n').filter((p) => p.length > 0)

    const channel = (await discord.client.channels.fetch(
      job.data.channelId
    )) as TextChannel
    const message = await channel.messages.fetch(job.data.messageId)
    await message.edit(`Bearbetar PDF...`)

    indexParagraphs.add(
      'found ' + paragraphs.length,
      {
        paragraphs,
        url: job.data.url,
        channelId: job.data.channelId,
        messageId: job.data.messageId,
        pdfHash: job.data.pdfHash,
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
    connection: redis,
    autorun: false,
  }
)

export default worker
