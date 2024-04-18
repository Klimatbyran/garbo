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
  'parsePDF',
  async (job: JobData) => {
    const { url, channelId, messageId } = job.data
    /*
    curl -X 'POST' \
    'https://api.cloud.llamaindex.ai/api/parsing/upload' \
    -H 'accept: application/json' \
    -H 'Content-Type: multipart/form-data' \
    -H "Authorization: Bearer $LLAMA_CLOUD_API_KEY" \
    -F 'file=@/path/to/your/file.pdf;type=application/pdf'*/

    job.log(`Downloading from url: ${url}`)
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()

    const fileBlob = new Blob([buffer], { type: 'application/pdf' })

    const formData = new FormData()
    formData.append('file', fileBlob, 'file.pdf')
    const jobResponse = await fetch(
      'https://api.cloud.llamaindex.ai/api/parsing/upload',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.LLAMA_CLOUD_API_KEY}`,
        },
        body: formData,
      }
    )
    job.log(`Job response: ${jobResponse.status}`)
    if (jobResponse.status !== 200) {
      throw new Error(`Job response: ${jobResponse.status}`)
    }
    const result = await jobResponse.json()

    // TODO: get the id
    /*   curl -X 'GET' \
  'https://api.cloud.llamaindex.ai/api/parsing/job/<job_id>' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $LLAMA_CLOUD_API_KEY"*/

    const id = result.id
    let ready = false
    job.log(`Job id: ${id}`)

    while (!ready) {
      const jobStatusResponse = await fetch(
        `https://api.cloud.llamaindex.ai/api/parsing/job/${id}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.LLAMA_CLOUD_API_KEY}`,
          },
        }
      )
      const jobStatus = await jobStatusResponse.json()
      if (jobStatus.status === 'done') {
        ready = true
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    // TODO: get the result
    /*
curl -X 'GET' \
  'https://api.cloud.llamaindex.ai/api/parsing/job/<job_id>/result/markdown' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $LLAMA_CLOUD_API_KEY"*/

    const resultResponse = await fetch(
      `https://api.cloud.llamaindex.ai/api/parsing/job/${id}/result/markdown`,
      {
        headers: {
          Authorization: `Bearer ${process.env.LLAMA_CLOUD_API_KEY}`,
        },
      }
    )
    const resultText = await resultResponse.text()
    const doc = {
      text: resultText,
    }
    const text = doc.text
    const pdfHash = await elastic.hashPdf(Buffer.from(buffer))

    splitText.add('split text ' + text.slice(0, 20), {
      url,
      text,
      channelId,
      messageId,
      pdfHash,
    })
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
