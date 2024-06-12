import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import pdf from 'pdf-parse-debugging-disabled'
import { splitText } from '../queues'
import discord from '../discord'
import opensearch from '../opensearch'

class JobData extends Job {
  declare data: {
    url: string
    threadId: string
  }
}

const worker = new Worker(
  'downloadPDF',
  async (job: JobData) => {
    const { url } = job.data

    job.log(`Downloading from url: ${url}`)
    const message = await discord.sendMessage(job.data, `🤖 Laddar ner PDF...`)

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 10; SM-G996U Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36', //Garbo/1.0 (Linux; OpenAI 4;) Klimatkollen',
        },
      })
      if (!response.ok) {
        await discord.sendMessage(
          job.data,
          `Nedladdning misslyckades: ${response.statusText}`
        )
        throw new Error(`Nedladdning misslyckades: ${response.statusText}`)
      }
      message?.edit(`🤖 Tolkar PDF...`)

      // save to disk
      // const pdfPath = path.join(__dirname, 'temp.pdf')
      // const pdfStream = fs.create
      // const pdfStream = fs.create
      // response.body.pipe(pdfStream)
      // pdfStream.on('finish', () => {
      //   console.log('pdf saved')
      // })

      const buffer = await response.arrayBuffer()

      let doc
      try {
        doc = await pdf(buffer)
      } catch (error) {
        throw new Error('Error parsing PDF')
      }
      const text = doc.text
      message.edit(`🤖 Hittade ${text.length} tecken. Delar upp i sidor...`)

      let pdfHash = ''
      try {
        pdfHash = await opensearch.hashPdf(Buffer.from(buffer))
      } catch (error) {
        job.log(`Error indexing PDF: ${error.message}`)
      }
      message.edit(`✅ PDF nedladdad!`)

      splitText.add('split text ' + text.slice(0, 20), {
        ...job.data,
        url,
        text,
        pdfHash,
      })

      return doc.text
    } catch (error) {
      discord.sendMessage(
        job.data,
        `Fel vid nedladdning av PDF: ${error.message}`
      )
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
