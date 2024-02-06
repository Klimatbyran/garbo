import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import pdf from 'pdf-parse'
import { splitText } from '../queues'
import fetch from 'node-fetch' // Import the fetch library
import axios from 'axios'
import { JSDOM } from 'jsdom'

class JobData extends Job {
  data: {
    url: string
  }
}

const worker = new Worker(
  'downloadData', // Rename the worker to reflect both PDF and webpage processing
  async (job: JobData) => {
    const { url } = job.data
    job.log(`Downloading from url: ${url}`)

    let text = ''

    if (url.endsWith('.pdf')) {
      // Try to fetch the content as a PDF
      try {
        const buffer = await fetch(url).then((res) => res.arrayBuffer())
        const doc = await pdf(buffer)
        text = doc.text
      } catch (pdfError) {
        console.error(`Error downloading pdf ${url}: ${pdfError}`)
      }
    } else {
      // Try to fetch the content as a web page
      try {
        const response = await axios.get(url)
        const html = response.data
        const { document } = new JSDOM(html).window

        const unnecessaryElements = document.querySelectorAll('script, style, link, meta, a, p, div')
        unnecessaryElements.forEach((element) => {
          if (element.tagName === 'A' || element.tagName === 'P' || element.tagName === 'DIV') {
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
