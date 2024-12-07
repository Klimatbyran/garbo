import { fromBuffer } from 'pdf2pic'
import { resolve, join } from 'path'
import { spawn } from 'child_process'
import {
  ParsedDocument,
  ParsedDocumentSchema,
  Table,
} from './nlm-ingestor-schema'
// import { jsonToTables } from './jsonExtraction'
import { writeFile, readFile } from 'fs/promises'
import { OUTPUT_DIR } from '../index'

async function parseDocument(docId: string) {
  return new Promise<void>((success, reject) => {
    const docParser = spawn('python', [resolve('src/parse_pdf.py'), docId])

    docParser.stdout.on('data', (data) => {
      console.log(data.toString().trimEnd())
    })

    docParser.stderr.on('data', (data) => {
      console.error(data.toString().trimEnd())
    })

    docParser.on('exit', (exitCode) => {
      if (exitCode !== 0) {
        reject()
      } else {
        success()
      }
    })
  })
}

// await parseDocument(resolve(OUTPUT_DIR, crypto.randomUUID(), 'input.pdf'))
try {
  await parseDocument(crypto.randomUUID())
} catch (e) {
  console.error('Parsing failed!')
}
process.exit(0)

/*
export async function extractJsonFromPdf(
  buffer: Buffer,
  docId: string,
): Promise<ParsedDocument> {
  // NOTE: Maybe there's a way to pass the input PDF without writing a file
  const inputFile = resolve(OUTPUT_DIR, docId, 'input.pdf')
  await writeFile(inputFile, buffer)

  await parseDocument(inputFile).catch(() => {
    // handle failure and return error
  })

  // TODO: When process is done, try reading `parsed.json`
  // Get the tables and use them
  // TODO: Later, try reading `parsed.md` when we should combine it with the document

  const body = 'TODO'

  // Validate basic response structure
  if (!body?.return_dict?.result?.blocks) {
    console.error('Invalid response structure:', JSON.stringify(body, null, 2))
    throw new Error('NLM Ingestor returned invalid response structure')
  }

  // Check for empty document
  const hasContent = body.return_dict.result.blocks.some(
    (block) => block.content && block.content.trim().length > 0,
  )

  if (!hasContent) {
    console.error('Document contains only empty blocks')
    console.error('Raw NLM ingestor response:', JSON.stringify(body, null, 2))
    throw new Error(
      'Document appears to be empty or could not be parsed properly',
    )
  }

  const result = ParsedDocumentSchema.safeParse(body)
  if (!result.success) {
    console.error('Schema validation failed:', result.error.format())
    throw new Error('Invalid response format from NLM Ingestor')
  }

  return result.data
}

type Page = {
  pageIndex: number
  pageWidth: number
  pageHeight: number
  tables: any[]
}

export function findRelevantTablesGroupedOnPages(
  json: ParsedDocument,
  searchTerms: string[],
): Page[] {
  const tables = jsonToTables(json).filter(({ content }) =>
    searchTerms.some((term) =>
      content.toLowerCase().includes(term.toLowerCase()),
    ),
  )
  return tables.reduce((acc: Page[], table: Table) => {
    const [pageWidth, pageHeight] = json.return_dict.page_dim
    const pageIndex = table.page_idx
    const page = acc.find((p) => p.pageIndex === pageIndex)
    if (page) {
      page.tables.push(table)
    } else {
      acc.push({
        pageIndex,
        tables: [table],
        pageWidth,
        pageHeight,
      })
    }
    return acc
  }, [])
}

export async function extractTablesFromJson(
  pdf: Buffer,
  json: ParsedDocument,
  outputDir: string,
  searchTerms: string[],
): Promise<{ pages: { pageIndex: number; filename: string }[] }> {
  const pdfConverter = (height: number, width: number) => {
    return fromBuffer(pdf, {
      density: 600,
      format: 'png',
      width,
      height,
      preserveAspectRatio: true,
    })
  }

  const pages = Object.values(
    findRelevantTablesGroupedOnPages(json, searchTerms),
  )
  // TODO: generate reportId when starting the request
  // create a directory for the reportId
  // save the incoming PDF file to the tmp directory
  // read the PDF file from python and process it
  // write parsed report output to a json file in the reportId directory
  // also write parsed report to a markdown file in the reportId directory
  // save images in the reportId directory
  // use vision API for tables
  // return the Docling parsed markdown, and combine with the more detailed tables
  // maybe: remove tmp files after processing completed successfully to save space
  // Or maybe store a timestamp in the first part of the directory name - and then check if it has passed more than 12h since the report was parsed, then remove it when receiving the next incoming request
  // trigger indexMarkdown after receiving the parsed report back in the garbo container.
  const reportId = crypto.randomUUID()
  const filenames = await Promise.all(
    pages.map(async ({ pageIndex, pageHeight, pageWidth }) => {
      const pageNumber = pageIndex + 1
      const pageScreenshotPath = join(
        outputDir,
        `${reportId}-page-${pageNumber}.png`,
      )
      const convert = pdfConverter(pageHeight * 2, pageWidth * 2)
      const result = await convert(pageNumber, { responseType: 'buffer' })

      if (!result.buffer) {
        throw new Error(
          `Failed to convert pageNumber ${pageNumber} to a buffer\n` +
            JSON.stringify(result, null, 2),
        )
      }

      await writeFile(pageScreenshotPath, result.buffer)
      return { pageIndex, filename: pageScreenshotPath }
    }),
  )
  return { pages: filenames }
}

*/
