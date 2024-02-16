import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import pdf from 'pdf-parse'
import { splitText } from '../queues'
import discord from '../discord'
import { TextChannel } from 'discord.js'
import { Client } from '@elastic/elasticsearch';

const esClient = new Client({ 
  node: 'http://elasticsearch.data-pipeline.svc.cluster.local:9200' 
});

class JobData extends Job {
  data: {
    url: string,
    channelId: string,
    messageId: string
  }
}

const worker = new Worker(
  'downloadPDF',
  async (job: JobData) => {
    const url = job.data.url
    const channelId = job.data.channelId
    const messageId = job.data.messageId
    
    job.log(`Downloading from url: ${url}`)
    const channel = await discord.client.channels.fetch(channelId) as TextChannel
    const message = await channel.messages.fetch(messageId)
    await message.edit(`Laddar ner PDF...`)

    const buffer = await fetch(url).then((res) => res.arrayBuffer())
    const doc = await pdf(buffer)
    const text = doc.text

    splitText.add('split text ' + text.slice(0, 20), {
      url,
      text,
      channelId,
      messageId,
    })

    return doc.text
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
