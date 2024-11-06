import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { UnrecoverableError } from 'bullmq'
import { extractTablesFromJson, fetchPdf } from '../lib/pdfTools'
import { jsonToMarkdown } from '../lib/jsonExtraction'
import path from 'path'
import { openai } from '../lib/openai'
import { readFileSync } from 'fs'

class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    json: string
  }
}

const base64Encode = (filename: string) => {
  const data = readFileSync(path.resolve(filename)).toString('base64')
  return 'data:image/png;base64,' + data
}

const extractTextViaVisionAPI = async (
  {
    filename,
    name,
  }: {
    filename: string
    name: string
  },
  context: string
) => {
  console.log('Extracting text from screenshot via Vision API')
  console.log('Filename:', filename)
  console.log('Name:', name)
  console.log('Context:', context)
  const result = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a CSRD expert and will extract text from a PDF with extract from the tables.',
      },
      {
        role: 'user',
        content: `I have a PDF with couple of tables related to a company's CO2 emissions. Can you extract the text from screenshot, especially a table called ${name}? I will send you the screenshot- only extract the table contents and ignore the surrounding text if they are not related to the tables/graphs (such as footnotes or disclaimers). Use Markdown format for the table(s), only reply with markdown. OK?`,
      },
      {
        role: 'assistant',
        content:
          'Sure. Sounds good. Send the screenhot and I will extract the table(s) and return in markdown format as accurately as possible without any other comment.',
      },
      {
        role: 'assistant',
        content:
          'This is previous table extracted from previous pages:' + context,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: base64Encode(filename), detail: 'high' },
          },
        ],
      },
    ],
  })
  return result.choices[0].message.content
}

const nlmExtractTables = new DiscordWorker(
  'nlmExtractTables',
  async (job: JobData) => {
    const { json, url } = job.data

    try {
      const pdf = await fetchPdf(url)
      const outputDir = path.resolve('/tmp')
      job.editMessage(`✅ PDF nedladdad!`)
      const results = await extractTablesFromJson(
        pdf,
        json,
        outputDir,
        'co2'
      ) /* TODO: is co2 search keyword enough to catch all relevant tables? */
      const markdownText = jsonToMarkdown(json)

      if (results.length === 0) {
        job.editMessage(
          `❌ Hittade inga relevanta tabeller i PDF:en. Går vidare med markdown...`
        )
        return { markdown: markdownText }
      } else {
        job.sendMessage(`🤖 Hittade ${results.length} relevanta tabeller: 
${results.map((r) => ' -  Sida ' + r.page_idx + ': ' + r.name).join('\n')}`)
        /* We will extract the tables using Vision API using the last 3 extracted tables as context. The reason is because sometimes the tables 
           will continue on the next page using column names or row names from previous page. */
        const tables = await results.reduce(
          async (accPromise, { page_idx, filename, name }) => {
            const acc = await accPromise
            const context = acc.map(
              ({ page_idx, name, markdown }) =>
                `\n#### ${name} (Extracted table with more precision from PAGE ${page_idx})\n\n${markdown}`
            )
            const markdown = await extractTextViaVisionAPI(
              { filename, name },
              context.slice(-3).join('\n') // last 3 tables.
            )
            return [...acc, { ...{ page_idx, filename, name, markdown } }]
          },
          Promise.resolve([])
        )
        job.log('Extracted tables: ' + tables.map((t) => t.markdown).join(', '))
        return {
          markdown:
            markdownText +
            '\n\n This is some of the important tables from the markdown with more precision:' +
            tables
              .map(
                ({ page_idx, name, markdown }) =>
                  `\n#### ${name} (Extracted table with more precision from PAGE ${page_idx})\n\n${markdown}`
              )
              .join('\n'),
        }
      }
    } catch (error) {
      job.editMessage(`❌ Fel vid nedladdning av PDF: ${error.message}`)
      throw new UnrecoverableError(`Download Failed: ${error.message}`)
    }
  }
)

export default nlmExtractTables
