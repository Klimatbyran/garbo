// ! Commented out until we have decided how to handle screenshots and table extraction
// import { UnrecoverableError } from 'bullmq'
// import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
// import { ParsedDocument } from '../lib/nlm-ingestor-schema'
// import { QUEUE_NAMES } from '../queues'
// import { createScreenshots } from '@/jobs/extractScreenshots/extractScreenshots'
// import { Logger } from '@/types'

// class NLMExtractTablesJob extends DiscordJob {
//   declare data: DiscordJob['data'] & {
//     json: ParsedDocument
//   }
// }

// const nlmExtractTables = new DiscordWorker(
//   QUEUE_NAMES.NLM_EXTRACT_TABLES,
//   async (job: NLMExtractTablesJob, logger: Logger) => {
//     const { json, url } = job.data
//     try {
//       await createScreenshots(json, url, logger)
//     } catch (error) {
//       logger.error(
//         `Error in ${QUEUE_NAMES.NLM_EXTRACT_TABLES}: ${error.message}`,
//       )
//       throw new UnrecoverableError(
//         `Error in ${QUEUE_NAMES.NLM_EXTRACT_TABLES}: ${error.message}`,
//       )
//     }
//   },
// )

import { readFileSync, statSync } from 'fs'
import { UnrecoverableError } from 'bullmq'
import path from 'path'
import { mkdir } from 'fs/promises'

import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { extractTablesFromJson, fetchPdf } from '../lib/pdfTools'
import { jsonToMarkdown } from '../lib/jsonExtraction'
import { openai } from '../lib/openai'
import { ParsedDocument } from '../lib/nlm-ingestor-schema'
import { QUEUE_NAMES } from '../queues'

class NLMExtractTablesJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    json: ParsedDocument
  }
}

const searchTerms = [
  // Carbon-related terms
  'co2',
  'co2e',
  'co2 eq',
  'carbon dioxide',
  'carbon footprint',
  'carbon emissions',
  'carbon neutral',
  'carbon intensity',
  'GHG',
  'greenhouse gas',
  'emissions',
  'scope 1',
  'scope 2',
  'scope 3',
  'climate impact',
  'carbon offset',

  // Swedish terms
  'utsläpp',
  'koldioxid',
  'koldioxidekvivalenter',
  'växthusgaser',
  'klimatavtryck',
  'klimatpåverkan',
  'klimatneutral',
]

const nlmExtractTables = new DiscordWorker(
  QUEUE_NAMES.NLM_EXTRACT_TABLES,
  process
)

async function process(job: NLMExtractTablesJob) {
  const { json, url } = job.data

  job.sendMessage('🔍 Söker efter relevanta tabeller...')

  try {
    const pdf = await fetchPdf(url)
    const outputDir = path.resolve('/tmp', 'garbo-screenshots')
    await mkdir(outputDir, { recursive: true })
    job.editMessage(`✅ PDF nedladdad!`)

    job.log('Extracting pages...')
    const { pages } = await extractTablesFromJson(
      pdf,
      json,
      outputDir,
      searchTerms
    )

    job.sendMessage(
      `🤖 Hittade relevanta tabeller på ${pages.length} unika sidor.`
    )

    job.log(`Extracted ${pages.length} pages. Extracting tables...`)

    // Filter out empty files first
    const validPages = pages.filter(({ filename }) => {
      const isValid = statSync(filename).size > 0
      if (!isValid) {
        job.log(`⚠️ Skipping empty image: ${filename}`)
      }
      return isValid
    })

    // Process tables in parallel
    const extractionPromises = validPages.map(
      async ({ pageNumber, filename }, index) => {
        // Use the previous table as context if available
        let contextMarkdown = ''
        if (index > 0) {
          // We need to wait for previous extractions, but only for providing context
          // This doesn't block parallel execution of API calls
          try {
            const previousResults = await Promise.any(
              extractionPromises.slice(0, index).map((p) => p.catch(() => null))
            )
            if (previousResults) {
              contextMarkdown = previousResults.markdown
            }
          } catch {
            // Continue without context if we can't get previous results
          }
        }

        const markdown =
          '## Page ' +
          pageNumber +
          '\n\n' +
          '### Extracted Tables:\n\n' +
          (await extractTextViaVisionAPI({ filename }, contextMarkdown))

        return {
          page_idx: Number(pageNumber - 1),
          markdown,
        }
      }
    )

    // Wait for all extractions to complete
    const tables = await Promise.all(extractionPromises)

    // Sort tables by page index to maintain order
    tables.sort((a, b) => a.page_idx - b.page_idx)

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
    job.editMessage(`❌ Fel vid tolkning av PDF: ${error.message}`)
    throw new UnrecoverableError(`Download Failed: ${error.message}`)
  }
}

const extractTextViaVisionAPI = async (
  { filename }: { filename: string },
  context: string
) => {
  const result = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are a CSRD expert and will extract text from a PDF with extract from the tables.',
      },
      {
        role: 'user',
        content: `I need you to extract tables related to CO2 emissions from this PDF screenshot. Please follow these exact instructions:

1. Extract tables and their headers from the screenshot
2. Please include all relevant text (headers, illustrations, descriptions, footnotes, disclaimers)
3. For any missing or empty cells in tables, use whitespace. If they have specifically n/a or not specified- use that instead. We want to preserve the actual information of the table as accurately as possible.
4. Format all tables using proper Markdown syntax
5. ONLY respond with the Markdown tables - no additional text or commentary except relevant footnotes or disclaimers that are part of the table.
6. If no tables are found in the image, respond with an empty string
7. Make specific note of the year columns and ensure they are included in the table headers - if the year or unit or other relevant information is avaiable elsewhere in the context or previous tables, adjust the tables so it is clear what year each column or row is representing.
8. If there are multiple tables, extract each one separately and return them as separate Markdown tables in the response.

I'll send you the screenshot momentarily. Can you follow these instructions precisely?`,
      },
      {
        role: 'assistant',
        content:
          'Sure. Sounds good. Send the screenshot and I will extract the table(s) if there are any and return in markdown format as accurately as possible without any other comment.',
      },
      {
        role: 'user',
        content:
          'This is previous table extracted from previous pages:' + context,
      },
      {
        role: 'assistant',
        content: 'Thanks, noted. Lets look at the screenshot.',
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

const base64Encode = (filename: string) => {
  const data = readFileSync(path.resolve(filename)).toString('base64')
  return 'data:image/png;base64,' + data
}

export default nlmExtractTables
