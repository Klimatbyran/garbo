import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { splitText } from '../queues'
import axios from 'axios'
import { JSDOM } from 'jsdom'
import { TextChannel } from 'discord.js'
import discord from '../discord'

class JobData extends Job {
  data: {
    url: string
    channelId: string,
    messageId: string
  }
}

const worker = new Worker(
  'downloadWebsite',
  async (job: JobData) => {
    const { url, channelId, messageId } = job.data
    
    job.log(`Downloading from url: ${url}`)
    const channel = await discord.client.channels.fetch(channelId) as TextChannel
    const message = await channel.messages.fetch(messageId)
    await message.edit(`Laddar ner sida...`)

    job.log(`Downloading website from url: ${url}`)

    let text = ''

    try {
      const response = await axios.get(url)
      const html = response.data
      const { document } = new JSDOM(html).window

      const unnecessaryElements = document.querySelectorAll(
        'script, style, link, meta, a, p, div'
      )
      unnecessaryElements.forEach((element) => {
        if (
          element.tagName === 'A' ||
          element.tagName === 'P' ||
          element.tagName === 'DIV'
        ) {
          const textNode = document.createTextNode(element.textContent || '')
          element.parentNode?.replaceChild(textNode, element)
        } else {
          element.remove()
        }
      })

      const cleanedHTML = document.documentElement.outerHTML
      text = cleanedHTML.replace(/\t\t/g, '\n\n')
    } catch (error) {
      await message.edit(`Fel vid nedladdning av sida: ${error.message}`);
      console.error(`Error downloading website ${url}: ${error}`)
    }

    splitText.add('split text ' + text.slice(0, 20), {
      url,
      text,
    })

    return text
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
