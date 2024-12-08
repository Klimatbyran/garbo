import { fromBuffer } from 'pdf2pic'
import { resolve, join } from 'path'
import { PythonShell } from 'python-shell'
import { writeFile, readFile, mkdir } from 'fs/promises'

import { ParsedDocument, Table } from './nlm-ingestor-schema'
import { jsonToTables } from './jsonExtraction'
import { DoclingDocument, DoclingDocumentSchema } from './docling-schema'

const OUTPUT_DIR = resolve('/tmp/pdf2markdown')

export async function convertPDF(
  buffer: Buffer,
): Promise<{ json: DoclingDocument; markdown: string }> {
  const docId = crypto.randomUUID()
  const outDir = resolve(OUTPUT_DIR, docId)
  await mkdir(outDir, { recursive: true })
  const inputPDF = resolve(outDir, 'input.pdf')

  // NOTE: Maybe there's a way to pass the input PDF without writing a file
  await writeFile(inputPDF, buffer, { encoding: 'utf-8' })

  try {
    // TODO: Figure out how to get both the stdout and stderr from the child process

    // await new Promise<void>((success, reject) => {
    //   const shell = new PythonShell(
    //     resolve(import.meta.dirname, '../parse_pdf.py'),
    //     {
    //       args: [inputPDF, outDir],
    //       stdio: 'inherit',
    //     },
    //   )

    //   shell.childProcess.stdout?.on?.('data', (chunk: any) => {
    //     console.log(chunk.toString())
    //   })

    //   shell.once('pythonError', (err) => {
    //     reject(err)
    //   })

    //   shell.once('close', () => {
    //     success()
    //   })
    // })
    await PythonShell.run(resolve(import.meta.dirname, '../parse_pdf.py'), {
      args: [inputPDF, outDir],
      stdio: ['pipe', 'inherit', 'pipe', 'pipe'],
    })
  } catch (e) {
    throw new Error('Conversion failed! ' + e)
  }

  const [rawJSON, markdown] = await Promise.all([
    readFile(resolve(outDir, 'parsed.json'), {
      encoding: 'utf-8',
    }).then(JSON.parse),
    readFile(resolve(outDir, 'parsed.md'), {
      encoding: 'utf-8',
    }),
  ])

  const {
    success,
    data: json,
    error,
  } = DoclingDocumentSchema.safeParse(rawJSON)
  if (!success) {
    console.error('Schema validation failed:', error.format())
    throw new Error('Invalid response format from Docling')
  }

  // Get unique page numbers, also for tables spanning multiple pages
  const uniquePages = new Set(
    json.tables.flatMap((t) => t.prov.map(({ page_no }) => page_no)),
  )

  console.log(
    'Found',
    json.tables.length,
    'tables on',
    uniquePages.size,
    'pages:',
    uniquePages,
  )
  console.log('Markdown length: ', markdown.length)

  return { json, markdown }
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
