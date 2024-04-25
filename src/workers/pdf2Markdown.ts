import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { splitText } from '../queues'
import elastic from '../elastic'
import llama from '../config/llama'
import discord from '../discord'
import { TextChannel } from 'discord.js'

const minutes = 60

/**
 * Creates a job to parse a PDF file.
 * @param buffer - The PDF file content as an ArrayBuffer.
 * @returns The ID of the created job.
 * @throws An error if the job response status is not 200.
 */
async function createPDFParseJob(buffer: ArrayBuffer) {
  const fileBlob = new Blob([buffer], { type: 'application/pdf' })

  const formData = new FormData()
  formData.append('file', fileBlob, 'file.pdf')
  const jobResponse = await fetch(
    'https://api.cloud.llamaindex.ai/api/parsing/upload',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${llama.token}`,
      },
      body: formData,
    }
  )
  if (jobResponse.status !== 200) {
    throw new Error(`Job response: ${jobResponse.status}`)
  }
  const result = await jobResponse.json()
  console.log('result', result)

  const id = result.id
  return id
}

/**
 * Waits until a job is finished.
 * @param id - The ID of the job.
 * @param retries - The number of retries (default: 100).
 * @returns A promise that resolves to true when the job is finished.
 * @throws An error if the job times out.
 */
async function waitUntilJobFinished(id: any, retries = 100) {
  let ready = false

  while (!ready) {
    const jobStatusResponse = await fetch(
      `https://api.cloud.llamaindex.ai/api/parsing/job/${id}`,
      {
        headers: {
          Authorization: `Bearer ${llama.token}`,
        },
      }
    )
    retries--
    console.log('retries', retries)
    if (retries === 0) {
      throw new Error('Timeout waiting for job')
    }
    const jobStatus = await jobStatusResponse.json()

    if (jobStatus.status === 'SUCCESS') {
      ready = true
    } else {
      console.log('jobStatus', jobStatus)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return true
}

/**
 * Retrieves the result text for a given job ID from the Llama Index API.
 * @param id - The ID of the job.
 * @returns The result text.
 */
async function getResults(id: any) {
  const resultResponse = await fetch(
    `https://api.cloud.llamaindex.ai/api/parsing/job/${id}/result/markdown`,
    {
      headers: {
        Authorization: `Bearer ${llama.token}`,
      },
    }
  )
  if (!resultResponse.ok)
    throw new Error('Failed to get results: ' + resultResponse.statusText)
  const json = await resultResponse.json()
  const text = json.markdown
  return text
}

class JobData extends Job {
  data: {
    url: string
    threadId: string
    existingId: string
    existingPdfHash: string
  }
}

/**
 * Worker responsible for parsing PDF files using LLama index parse endpoint.
 */
const worker = new Worker(
  'pdf2Markdown',
  async (job: JobData) => {
    const { url, existingId, existingPdfHash } = job.data
    let id = existingId
    let pdfHash = existingPdfHash
    let message = null
    if (!existingId) {
      job.log(`Downloading from url: ${url}`)
      message = discord.sendMessage(job.data, '🤖 Laddar ner PDF...')

      const response = await fetch(url)
      const buffer = await response.arrayBuffer()
      pdfHash = await elastic.hashPdf(Buffer.from(buffer))

      job.log(`Creating job for url: ${url}`)
      message = discord.sendMessage(job.data, '🤖 Tolkar tabeller...')

      try {
        id = await createPDFParseJob(buffer)
      } catch (error) {
        discord.sendMessage(job.data, '❌ LLama fel: ' + error.message)
        return
      }
      await job.updateData({
        ...job.data,
        existingId: id,
        existingPdfHash: pdfHash,
      })
    }

    job.log(`Wait until PDF is parsed: ${id}`)
    await waitUntilJobFinished(id, 10 * minutes)
    message?.edit('Laddar ner resultatet...')

    job.log(`Finished waiting for job ${id}`)
    const text = await getResults(id)
    job.log(`Got ${text.length} chars. First pages are: ${text.slice(0, 2000)}`)

    message?.edit('✅ Tolkning klar!')
    splitText.add('split text ' + text.slice(0, 20), {
      ...job.data,
      pdfHash,
      text,
      markdown: true,
    })
  },
  {
    concurrency: 10,
    skipStalledCheck: true,
    connection: redis,
    autorun: false,
  }
)

export default worker
