import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { splitText } from '../queues'
import axios from 'axios'
import { JSDOM } from 'jsdom'

class JobData extends Job {
  data: {
    url: string
  }
}

const worker = new Worker(
  'downloadWebsite',
  async (job: JobData) => {
    const { url } = job.data
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
    } catch (webError) {
      console.error(`Error downloading website ${url}: ${webError}`)
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
