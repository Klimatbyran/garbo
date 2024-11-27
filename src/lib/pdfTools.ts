import sharp from 'sharp'
import { pdf } from 'pdf-to-img'
import { jsonToTables, Table, TableWithFilename } from './jsonExtraction'
import path from 'path'
import nlmIngestorConfig from '../config/nlmIngestor'
import {
  type ParsedDocument,
  ParsedDocumentSchema,
} from './nlm-ingestor-schema'

async function getPngsFromPdfPage(stream: Buffer) {
  const pages = await pdf(stream, {
    scale: 2,
  })
  return pages
}

async function extractRegionAsPng(png, outputPath, x, y, width, height) {
  // Ladda PDF-dokumentet
  // Använd `sharp` för att beskära och spara regionen
  console.log('Extracting region', x, y, width, height)
  return await sharp(png).toFile(outputPath)
}

export async function fetchPdf(url: string, headers = {}): Promise<Buffer> {
  const pdfResponse = await fetch(url, { headers })
  if (!pdfResponse.ok) {
    throw new Error(`Failed to fetch PDF from URL: ${pdfResponse.statusText}`)
  }
  const arrayBuffer = await pdfResponse.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function extractJsonFromPdf(
  buffer: Buffer
): Promise<ParsedDocument> {
  const formData = new FormData()
  formData.append('file', new Blob([buffer]), 'document.pdf')
  const url = `${nlmIngestorConfig.url}/api/parseDocument?renderFormat=json`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      body: formData,
    })
  } catch (err) {
    console.error(
      'Failed to parse PDF with NLM ingestor, have you started the docker container? (' +
        nlmIngestorConfig.url +
        ')'
    )
    response = { ok: false, statusText: err.message } as Response
  }

  if (!response.ok) {
    throw new Error(`Failed to parse PDF: ${response.statusText}`)
  }

  const body = await response.json()
  try {
    const data = ParsedDocumentSchema.parse(body)
    return data
  } catch (error) {
    console.error(error)
    throw new Error(
      `Failed to parse PDF: nlm-ingestor response schema did not match expected format: ${error.message}`,
      { cause: error }
    )
  }
}

type Page = {
  pageIndex: number
  pageWidth: number
  pageHeight: number
  tables: any[]
}

export function findRelevantTablesGroupedOnPages(
  json: ParsedDocument,
  searchTerms: string[]
): Page[] {
  const tables = jsonToTables(json).filter(({ content }) =>
    searchTerms.some((term) =>
      content.toLowerCase().includes(term.toLowerCase())
    )
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
  searchTerms: string[]
): Promise<{ tables: TableWithFilename[]; uniquePageCount: number }> {
  const pngs = await getPngsFromPdfPage(pdf)
  const pages = Object.values(
    findRelevantTablesGroupedOnPages(json, searchTerms)
  )

  const processedPages = new Set<number>()

  const tablePromises = pages.map(
    ({ pageIndex, tables, pageWidth, pageHeight }) => {
      if (processedPages.has(pageIndex)) {
        return tables.map((table) =>
          Promise.resolve({ ...table, filename: null })
        )
      }

      processedPages.add(pageIndex)

      const pageScreenshotPath = path.join(
        outputDir,
        `page-${pageIndex}-${crypto.randomUUID()}.png`
      )
      return pngs.getPage(pageIndex + 1).then((png) => {
        /* Denna fungerar inte än pga boundingbox är fel pga en bugg i NLM ingestor BBOX (se issue här: https://github.com/nlmatics/nlm-ingestor/issues/66). 
             När den är fixad kan denna användas istället för att beskära hela sidan. */
        /* TODO: fixa boundingbox för tabeller
          const { x, y, width, height } = calculateBoundingBoxForTable(
            table,
            pageWidth,
            pageHeight
          )*/
        const pageWidth2 = Math.floor(pageWidth * 2)
        const pageHeight2 = Math.floor(pageHeight * 2)

        return extractRegionAsPng(
          png,
          pageScreenshotPath,
          0,
          0,
          pageWidth2,
          pageHeight2
        ).then(() =>
          tables.map((table) => ({ ...table, filename: pageScreenshotPath }))
        )
      })
    }
  )

  const tables = await Promise.all(tablePromises).then((results) =>
    results.flat()
  )
  const uniquePageCount = processedPages.size

  return { tables, uniquePageCount }
}
