import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { downloadPDF, downloadWebsite } from '../queues';
import discord from '../discord';
import { TextChannel } from 'discord.js';

class JobData extends Job {
  data: {
    url: string
    channelId: string,
    messageId: string
  }
}

const worker = new Worker(
  'checkURL',
  async (job: JobData) => {
    const { url, channelId, messageId } = job.data
    
    job.log(`Downloading from url: ${url}`)
    const channel = await discord.client.channels.fetch(channelId) as TextChannel
    const message = await channel.messages.fetch(messageId)
    await message.edit(`Undersöker om rapporten är pdf eller webbsida...`)

    const fileType = url.endsWith('.pdf') ? 'pdf' : 'webpage'
    if (fileType === 'pdf') {
      job.log('Data is PDF: ' + url)
      downloadPDF.add('download data ' + url, { url, channelId, messageId })
    } else {
      job.log('Data is website: ' + url)
      downloadWebsite.add('download data ' + url, { url, channelId, messageId })
    }      
    return { fileType, url }
  },
  {
    connection: redis,
    autorun: false,
  }
);

export default worker;
