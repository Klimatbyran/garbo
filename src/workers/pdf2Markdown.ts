import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { pdf2Markdown, splitText, searchVectors } from '../queues'
import * as crypto from 'crypto'
import llama from '../config/llama'
import discord from '../discord'
import { ChromaClient } from 'chromadb'
import { OpenAIEmbeddingFunction } from 'chromadb'
import chromadb from '../config/chromadb'
import openai from '../config/openai'
import { DiscordWorker, DiscordJob } from '../lib/DiscordWorker'

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

function hashPdf(pdfBuffer: Buffer): string {
  return crypto.createHash('sha256').update(pdfBuffer).digest('hex')
}

/**
 * Waits until a job is finished, yielding job status updates every second.
 * @param id - The ID of the job.
 * @param timeoutSeconds - The time in seconds before timing out (default: 600 seconds or 10 minutes).
 * @returns A promise that resolves to true when the job is finished.
 * @throws An error if the job times out.
 */
async function* waitUntilJobFinished(id, timeoutSeconds = 600) {
  const startTime = Date.now()

  while (Date.now() - startTime < timeoutSeconds * 1000) {
    const jobStatusResponse = await fetch(
      `https://api.cloud.llamaindex.ai/api/parsing/job/${id}`,
      {
        headers: {
          Authorization: `Bearer ${llama.token}`,
        },
      }
    )
    const jobStatus = await jobStatusResponse.json()

    if (jobStatus.status === 'SUCCESS') {
      return true
    }

    yield jobStatus // Yield the current status for processing in the loop

    await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait for 1 second before checking again
  }

  throw new Error('Timeout waiting for job')
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

class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    existingId: string
    existingPdfHash: string
  }
}

/**
 * Worker responsible for parsing PDF files using LLama index parse endpoint.
 */
const worker = new DiscordWorker('pdf2Markdown', async (job: JobData) => {
  const { url, existingId, existingPdfHash } = job.data
  let id = existingId
  let pdfHash = existingPdfHash
  let text = null

  await job.sendMessage('🤖 Kollar cache...')

  // Initialize ChromaClient and embedding function
  const client = new ChromaClient(chromadb)
  const embedder = new OpenAIEmbeddingFunction(openai)

  try {
    // Check if the URL already exists in the vector database
    const collection = await client.getOrCreateCollection({
      name: 'emission_reports',
      embeddingFunction: embedder,
    })
    const exists = await collection
      .get({
        where: { $and: [{ source: url }, { markdown: true }] },
        limit: 1,
      })
      .then((r) => r?.documents?.length > 0)

    if (exists) {
      // Skip to search vectors if the URL already exists
      job.editMessage('✅ Detta dokument fanns redan i vektordatabasen.')
      job.log(`URL ${url} already exists. Skipping to search vectors.`)
      searchVectors.add('search ' + url.slice(-20), {
        url,
        threadId: job.data.threadId,
        markdown: true,
        pdfHash: job.data.existingPdfHash,
      })
      return
    }
  } catch (error) {
    console.error(`Error checking URL ${url} in the vector database: ${error}`)
    job.editMessage(
      `❌ Ett fel uppstod när vektordatabasen skulle nås: ${error}`
    )
    throw error
  }

  const previousJob = (await pdf2Markdown.getCompleted()).find(
    (p) => p.data.url === url && p.returnvalue !== null
  )
  if (previousJob) {
    job.editMessage('👌 Filen var redan hanterad. Återanvänder resultat.')
    job.log(`Using existing job: ${id}`)
    text = previousJob.returnvalue
  } else if (!previousJob || !existingId) {
    job.log(`Downloading from url: ${url}`)

    const response = await fetch(url)
    const buffer = await response.arrayBuffer()
    pdfHash = hashPdf(Buffer.from(buffer))

    job.editMessage('🤖 Tolkar tabeller...')

    try {
      id = await createPDFParseJob(buffer)
    } catch (error) {
      job.sendMessage('❌ LLama fel: ' + error.message)
      throw error
    }
    await job.updateData({
      ...job.data,
      existingId: id,
      existingPdfHash: pdfHash,
    })

    job.log(`Wait until PDF is parsed: ${id}`)
    const totalSeconds = 10 * minutes // Define total waiting time
    let count = 0
    for await (const jobStatus of waitUntilJobFinished(id, totalSeconds)) {
      count++
      job.log(jobStatus)
      job.updateProgress(Math.round((count / totalSeconds) * 100)) // Update progress based on time elapsed
    }
    job.editMessage('🤖 Laddar ner resultatet...')

    job.log(`Finished waiting for job ${id}`)
    try {
      text = await getResults(id)
    } catch (error) {
      job.sendMessage('❌ LLama fel: ' + error.message + ' #' + id)
      throw error
    }
  }

  job.log(`Got result: 
${text}`)
  job.editMessage('✅ Tolkning klar!')
  splitText.add('split text ' + text.slice(0, 20), {
    ...job.data,
    pdfHash,
    text,
    markdown: true,
  })
  return text
})

export default worker
