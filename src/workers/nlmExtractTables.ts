import { readFileSync } from 'fs'
import { UnrecoverableError } from 'bullmq'
import path from 'path'

import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { extractTablesFromJson, fetchPdf } from '../lib/pdfTools'
import { jsonToMarkdown } from '../lib/jsonExtraction'
import { openai } from '../lib/openai'
import { ParsedDocument } from '../lib/nlm-ingestor-schema'

class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    json: ParsedDocument
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
        content: `I have a PDF with couple of tables related to a company's CO2 emissions. Can you extract the text from screenshot. I will send you the screenshot extract the header and table contents and ignore the surrounding text if they are not related to the tables/graphs (such as header, description, footnotes or disclaimers). Use Markdown format for the table(s), only reply with markdown. OK?`,
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

const searchTerms = [
  'co2',
  'GHG',
  'turnover',
  'revenue',
  'income',
  'employees',
  'FTE',
  'fiscal year',
  'summary',
]
const nlmExtractTables = new DiscordWorker(
  'nlmExtractTables',
  async (job: JobData) => {
    const { json, url } = job.data

    try {
      const pdf = await fetchPdf(url)
      const outputDir = path.resolve('/tmp')
      job.editMessage(`✅ PDF nedladdad!`)
      const { tables: results, uniquePageCount } = await extractTablesFromJson(
        pdf,
        json,
        outputDir,
        searchTerms
      )

      const totalTables = results.length

      job.sendMessage(
        `🤖 Hittade ${totalTables} relevanta tabeller på ${uniquePageCount} unika sidor.`
      )

      const groupedResults = results.reduce((acc, table) => {
        acc[table.page_idx] = acc[table.page_idx] || []
        acc[table.page_idx].push(table)
        return acc
      }, {} as Record<number, typeof results>)

      const tables = await Object.entries(groupedResults).reduce(
        async (resultsPromise, [page_idx, tablesOnPage]) => {
          const results = await resultsPromise
          const lastPageMarkdown = results.at(-1)?.markdown || ''
          const filename = tablesOnPage[0].filename
          const markdown = await extractTextViaVisionAPI(
            { filename, name: `Tables from page ${page_idx}` },
            lastPageMarkdown.slice(0, 5000)
          )
          // TODO: Send to s3 bucket (images)
          return [
            ...results,
            {
              page_idx: Number(page_idx),
              tablesOnPage, // TODO: Use when bounding box error has been corrected
              markdown,
            },
          ]
        },
        Promise.resolve([] as any)
      )

      job.log('Extracted tables: ' + tables.map((t) => t.markdown).join(', '))

      return {
        markdown:
          jsonToMarkdown(json) +
          '\n\n This is some of the important tables from the markdown with more precision:' +
          tables
            .map(
              ({ page_idx, markdown }) =>
                `\n#### Page ${page_idx}: 
                  ${markdown}`
            )
            .join('\n'),
      }
    } catch (error) {
      job.editMessage(`❌ Fel vid nedladdning av PDF: ${error.message}`)
      throw new UnrecoverableError(`Download Failed: ${error.message}`)
    }
  }
)

export default nlmExtractTables
