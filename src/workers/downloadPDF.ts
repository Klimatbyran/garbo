import pdf from 'pdf-parse-debugging-disabled'
import { downloadPDF, splitText } from '../queues'
import * as crypto from 'crypto'
import { DiscordWorker, DiscordWorkerJobData } from '../lib/DiscordWorker'

type DiscordJobData = {
  threadId: string
}

type DownloadPDFJobData = DiscordJobData & {
  url: string
}

// IDEA: Maybe rather extend the queue to define the jobs created in that queue? Not sure.
export function createDownloadPDFJob(
  name: string,
  jobData: DownloadPDFJobData
) {
  // NOTE: Maybe slightly better to co-locate job creation with the worker. We could also pass along basic job data with a common helper.
  downloadPDF.add(name, jobData)
}

type JobData = DiscordWorkerJobData & {
  url: string
  threadId: string
}

function hashPdf(pdfBuffer: Buffer): string {
  return crypto.createHash('sha256').update(pdfBuffer).digest('hex')
}

const worker = new DiscordWorker<JobData>('downloadPDF', async (job) => {
  const { url } = job.data

  job.log(`Downloading from url: ${url}`)

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 10; SM-G996U Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36', //Garbo/1.0 (Linux; OpenAI 4;) Klimatkollen',
      },
    })
    if (!response.ok) {
      await job.sendMessage(`Nedladdning misslyckades: ${response.statusText}`)
      throw new Error(`Nedladdning misslyckades: ${response.statusText}`)
    }
    job.editMessage(`🤖 Tolkar PDF...`)

    const buffer = await response.arrayBuffer()

    let doc
    try {
      doc = await pdf(buffer)
    } catch (error) {
      throw new Error('Error parsing PDF')
    }
    const text = doc.text
    job.editMessage(`🤖 Hittade ${text.length} tecken. Delar upp i sidor...`)

    let pdfHash = ''
    try {
      pdfHash = await hashPdf(Buffer.from(buffer))
    } catch (error) {
      job.log(`Error indexing PDF: ${error.message}`)
    }
    job.editMessage(`✅ PDF nedladdad!`)

    splitText.add('split text ' + text.slice(0, 20), {
      ...job.data,
      url,
      text,
      pdfHash,
    })

    return doc.text
  } catch (error) {
    job.sendMessage(`Fel vid nedladdning av PDF: ${error.message}`)
    job.log(`Error downloading PDF: ${error.message}`)
    throw error
  }
})

export default worker
