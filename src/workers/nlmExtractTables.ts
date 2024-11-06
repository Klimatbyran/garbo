import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { UnrecoverableError } from 'bullmq'
import {
  extractTablesFromJson,
  extractTablesFromPDF,
  fetchPdf,
} from '../lib/pdfTools'
import { jsonToMarkdown } from '../lib/jsonExtraction'
import indexParagraphs from './indexParagraphs'
import path from 'path'
import discord from '../discord'

class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    json: string
  }
}

const nlmExtractTables = new DiscordWorker(
  'nlmExtractTables',
  async (job: JobData) => {
    const { json, url } = job.data

    try {
      const markdown = jsonToMarkdown(json)
      indexParagraphs.queue.add('indexParagraphs', {
        ...job.data,
        paragraphs: markdown.split('### '),
        markdown: true,
      })

      const pdf = await fetchPdf(url)
      const outputDir = path.resolve('/tmp')
      job.editMessage(`✅ PDF nedladdad!`)
      const results = await extractTablesFromJson(pdf, json, outputDir, 'co2')
      if (results.length === 0) {
        job.editMessage(`❌ Hittade inga tabeller i PDF:en.`)
        return
      } else {
        job.sendMessage(`🤖 Hittade ${results.length} relevanta tabeller: 
${results.map((r) => ' -  Sida ' + r.page_idx + ': ' + r.name).join('\n')}`)
      }
      job.log(`Found ${results.length} tables`)
      const markdownText = jsonToMarkdown(json)
      job.log(markdownText)

      return markdownText
    } catch (error) {
      job.editMessage(`❌ Fel vid nedladdning av PDF: ${error.message}`)
      throw new UnrecoverableError(`Download Failed: ${error.message}`)
    }
  }
)

export default nlmExtractTables
