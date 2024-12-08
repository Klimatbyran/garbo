import { resolve, join } from 'path'
import { PythonShell } from 'python-shell'
import { writeFile, readFile, mkdir } from 'fs/promises'

import { jsonToTables } from './jsonExtraction'
import { DoclingDocument, DoclingDocumentSchema, Table } from './docling-schema'

const OUTPUT_DIR = resolve('/tmp/pdf2markdown')

export async function convertPDF(
  buffer: Buffer,
  docId: string,
): Promise<{ json: DoclingDocument; markdown: string }> {
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
  tables: Table[]
}

export function findRelevantTablesGroupedOnPages(
  json: DoclingDocument,
  searchTerms: string[],
): Page[] {
  // HACK: JSON.stringify() the page with the table, and then check if it includes any relevant search terms
  // Actually, we need to evaluate each node and its value
  const tables = json.tables.filter((table) => {
    const tableContent = JSON.stringify(table)
    searchTerms.some((term) =>
      content.toLowerCase().includes(term.toLowerCase()),
    )
  })
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
  json: DoclingDocument,
  outDir: string,
  searchTerms: string[],
): Promise<{ pages: { pageIndex: number; filename: string }[] }> {
  const pages = Object.values(
    findRelevantTablesGroupedOnPages(json, searchTerms),
  )
  const filenames = await Promise.all(
    pages.map(async ({ pageIndex, pageHeight, pageWidth }) => {
      const pageNumber = pageIndex + 1
      const pageScreenshotPath = join(outDir, `/pages/page-${pageNumber}.png`)

      return { pageIndex, filename: pageScreenshotPath }
    }),
  )
  return { pages: filenames }
}
