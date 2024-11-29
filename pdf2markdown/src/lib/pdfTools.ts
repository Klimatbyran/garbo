import { fromBuffer } from 'pdf2pic'
import path from 'path'
import {
  ParsedDocument,
  ParsedDocumentSchema,
  Table,
} from './nlm-ingestor-schema'
import { jsonToTables } from './jsonExtraction'
import { writeFile } from 'fs/promises'

const NLM_INGESTOR_URL = 'http://localhost:5001'

async function checkNLMIngestorStatus() {
  try {
    const response = await fetch(`${NLM_INGESTOR_URL}`)
    if (!response.ok) {
      throw new Error(
        `NLM Ingestor health check failed: ${response.statusText}`
      )
    }
  } catch (error) {
    throw new Error(`NLM Ingestor service not available: ${error.message}`)
  }
}

export async function extractJsonFromPdf(
  buffer: Buffer
): Promise<ParsedDocument> {
  await checkNLMIngestorStatus()
  const formData = new FormData()
  formData.append('file', new Blob([buffer]), 'document.pdf')
  const url = `${NLM_INGESTOR_URL}/api/parseDocument?renderFormat=json`

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(6 * 60 * 1000), // 6 minutes
  })

  if (!response.ok) {
    throw new Error(`Failed to parse PDF: ${response.statusText}`)
  }

  const body = await response.json()
  console.log('Raw NLM ingestor response:', JSON.stringify(body, null, 2))

  // Enhanced debugging
  console.log('\n=== Detailed Response Analysis ===')
  console.log('1. Response structure:')
  console.log('- Has return_dict:', 'return_dict' in body)
  if (body.return_dict) {
    console.log('- Return dict keys:', Object.keys(body.return_dict))
    if (body.return_dict.result) {
      console.log('- Result keys:', Object.keys(body.return_dict.result))
      if (Array.isArray(body.return_dict.result.blocks)) {
        console.log('\n2. Blocks analysis:')
        console.log('- Total blocks:', body.return_dict.result.blocks.length)
        body.return_dict.result.blocks.forEach((block, index) => {
          console.log(`\nBlock ${index}:`)
          console.log(
            '- Type:',
            'rows' in block
              ? 'Table'
              : 'level' in block
              ? 'Header'
              : 'Paragraph'
          )
          console.log('- Has content:', 'content' in block)
          console.log('- Content type:', typeof block.content)
          console.log('- Content preview:', block.content?.substring(0, 100))
          console.log('- Properties:', Object.keys(block))
        })
      }
    }
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
    findRelevantTablesGroupedOnPages(json, searchTerms)
  )
  const reportId = crypto.randomUUID()
  const filenames = await Promise.all(
    pages.map(async ({ pageIndex, pageHeight, pageWidth }) => {
      const pageNumber = pageIndex + 1
      const pageScreenshotPath = path.join(
        outputDir,
        `${reportId}-page-${pageNumber}.png`
      )
      const convert = pdfConverter(pageHeight * 2, pageWidth * 2)
      const result = await convert(pageNumber, { responseType: 'buffer' })

      if (!result.buffer) {
        throw new Error(
          `Failed to convert pageNumber ${pageNumber} to a buffer\n` +
            JSON.stringify(result, null, 2)
        )
      }

      await writeFile(pageScreenshotPath, result.buffer)
      return { pageIndex, filename: pageScreenshotPath }
    })
  )
  return { pages: filenames }
}
