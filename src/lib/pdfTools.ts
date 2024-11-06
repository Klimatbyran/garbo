import sharp from 'sharp'
import { pdf } from 'pdf-to-img'
import {
  calculateBoundingBoxForTable,
  jsonToTables,
  Table,
} from './jsonExtraction'
import path from 'path'

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
  return await sharp(png)
    .extract({ left: x, top: y, width: width, height: height })
    .toFile(outputPath)
}

export async function fetchPdf(url: string, headers = {}): Promise<Buffer> {
  const pdfResponse = await fetch(url, { headers })
  if (!pdfResponse.ok) {
    throw new Error(`Failed to fetch PDF from URL: ${pdfResponse.statusText}`)
  }
  const arrayBuffer = await pdfResponse.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function extractJsonFromPdf(buffer: Buffer) {
  const nlmIngestorUrl = process.env.NLM_INGESTOR_URL || 'http://localhost:5010'
  console.log('parsing pdf from', nlmIngestorUrl)

  const formData = new FormData()
  formData.append('file', new Blob([buffer]), 'document.pdf')

  let response
  try {
    response = await fetch(
      `${nlmIngestorUrl}/api/parseDocument?renderFormat=json`,
      {
        method: 'POST',
        body: formData,
      }
    )
  } catch (err) {
    console.error(
      'Failed to parse PDF with NLM ingestor, have you started the docker container? (' +
        nlmIngestorUrl +
        ')'
    )
  }

  if (!response.ok) {
    throw new Error(`Failed to parse PDF: ${response.statusText}`)
  }

  return response.json()
}

type Page = {
  pageIndex: number
  pageWidth: number
  pageHeight: number
  tables: any[]
}

export function findRelevantTablesGroupdOnPages(
  json: any,
  searchTerm: string
): Page[] {
  const tables = jsonToTables(json).filter(
    ({ content }) => content.toLowerCase().includes(searchTerm) || !searchTerm
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
  json: any,
  outputDir: string,
  searchTerm: string
): Promise<Table[]> {
  const pngs = await getPngsFromPdfPage(pdf)
  const pages = findRelevantTablesGroupdOnPages(json, searchTerm)

  const tablePromises = pages.flatMap(
    ({ pageIndex, tables, pageWidth, pageHeight }) =>
      tables.map((table) =>
        pngs.getPage(pageIndex + 1).then((png) => {
          const { x, y, width, height } = calculateBoundingBoxForTable(
            table,
            pageWidth,
            pageHeight
          )
          const pngName = `table-${pageIndex}-${table.name}.png`
          const filename = path.join(outputDir, pngName)
          //console.log(url, pageIndex, x, y, width, height, table)
          console.log('extracting screenshot to outputPath', filename)
          return extractRegionAsPng(png, filename, x, y, width, height).then(
            () => {
              return { ...table, filename } as Table
            }
          )
        })
      )
  )

  return Promise.all(tablePromises)
}
