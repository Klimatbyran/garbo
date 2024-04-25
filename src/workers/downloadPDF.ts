import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import pdf from 'pdf-parse'
import { splitText } from '../queues'
import discord from '../discord'
import { TextChannel } from 'discord.js'
import elastic from '../elastic'

class JobData extends Job {
  data: {
    url: string
    channelId: string
    messageId: string
  }
}

const worker = new Worker(
  'downloadPDF',
  async (job: JobData) => {
    const { url, channelId, messageId } = job.data

    job.log(`Downloading from url: ${url}`)
    const channel = (await discord.client.channels.fetch(
      channelId
    )) as TextChannel
    const message = await channel?.messages?.fetch(messageId)
    if (message) await message.edit(`Laddar ner PDF...`)

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 10; SM-G996U Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36', //Garbo/1.0 (Linux; OpenAI 4;) Klimatkollen',
        },
      })
      if (!response.ok) {
        throw new Error(`Nedladdning misslyckades: ${response.statusText}`)
      }
      if (message) await message.edit(`Tolkar PDF...`)
      const buffer = await response.arrayBuffer()
      let doc
      try {
        doc = await pdf(buffer)
      } catch (error) {
        if (message)
          await message.edit(`Fel vid tolkning av PDF: ${error.message}`)
        job.log(`Error parsing PDF: ${error.message}`)
        throw error
      }
      const text = doc.text
      if (message)
        await message.edit(
          `Hittade ${text.length} tecken. Delar upp i sidor...`
        )

      let pdfHash = ''
      try {
        pdfHash = await elastic.hashPdf(Buffer.from(buffer))
      } catch (error) {
        job.log(`Error indexing PDF: ${error.message}`)
      }

      splitText.add('split text ' + text.slice(0, 20), {
        url,
        text,
        channelId,
        messageId,
        pdfHash,
      })

      return doc.text
    } catch (error) {
      if (message)
        await message.edit(`Fel vid nedladdning av PDF: ${error.message}`)
      job.log(`Error downloading PDF: ${error.message}`)
      throw error
    }
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
