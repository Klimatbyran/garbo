import { DiscordWorker } from '../lib/DiscordWorker'
import { UnrecoverableError } from 'bullmq'
import { extractJsonFromPdf, fetchPdf } from '../lib/pdfTools'
import nlmExtractTables from './nlmExtractTables'

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 10; SM-G996U Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36', //Garbo/1.0 (Linux; OpenAI 4;) Klimatkollen',
}

const nlmParsePDF = new DiscordWorker('nlmParsePDF', async (job) => {
  const { url } = job.data

  job.log(`Downloading from url: ${url}`)
  try {
    const pdf = await fetchPdf(url, { headers })
    job.editMessage(`✅ PDF nedladdad`)
    const json = await extractJsonFromPdf(pdf)
    job.editMessage(`✅ PDF tolkad`)

    nlmExtractTables.queue.add('nlmExtractTables', {
      ...job.data,
      json,
    })

    job.log(`Found json: 
    ${JSON.stringify(json, null, 2)}`)
  } catch (error) {
    job.editMessage(`❌ Fel vid nedladdning av PDF: ${error.message}`)
    throw new UnrecoverableError(`Download Failed: ${error.message}`)
  }
})

export default nlmParsePDF
