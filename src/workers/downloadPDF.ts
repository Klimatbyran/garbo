import pdf from 'pdf-parse-debugging-disabled'
import { DiscordWorker } from '../lib/DiscordWorker'
import { UnrecoverableError } from 'bullmq'
import splitText from './splitText'

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 10; SM-G996U Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36', //Garbo/1.0 (Linux; OpenAI 4;) Klimatkollen',
}

const downloadPDF = new DiscordWorker('downloadPDF', async (job) => {
  const { url } = job.data

  job.log(`Downloading from url: ${url}`)
  const response = await fetch(url, { headers })
  if (!response.ok) {
    throw new UnrecoverableError(`Download Failed: ${response.statusText}`)
  }
  job.sendMessage(`🤖 Tolkar PDF...`)

  const buffer = await response.arrayBuffer()
  const doc = await pdf(buffer)
  const text = doc.text
  job.editMessage(`✅ PDF nedladdad!`)
  job.sendMessage(`🤖 Hittade ${text.length} tecken. Delar upp i sidor...`)
  splitText.queue.add('split text ' + text.slice(0, 20), {
    ...job.data,
    url,
    text,
  })

  return doc.text
})

export default downloadPDF
