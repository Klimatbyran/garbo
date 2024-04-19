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
    const { url, channelId, markdown, messageId, pdfHash } = job.data

    job.log(`Splitting text: ${job.data.text.slice(0, 20)}`)

    const paragraphs = job.data.markdown
      ? job.data.text.split('##').filter((p) => p.trim().length > 0)
      : job.data.text.split('\n\n').filter((p) => p.trim().length > 0)

    const channel = (await discord.client.channels.fetch(
      job.data.channelId
    )) as TextChannel
    const message = await channel.messages.fetch(job.data.messageId)
    await message.edit(`Bearbetar PDF...`)

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
