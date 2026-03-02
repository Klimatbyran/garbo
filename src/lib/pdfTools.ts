import { fromBuffer } from 'pdf2pic'
import path from 'path'
import {
  type ParsedDocument,
  ParsedDocumentSchema,
} from './nlm-ingestor-schema'

import { jsonToTables, Table } from './jsonExtraction'
import nlmIngestorConfig from '../config/nlmIngestor'
import { writeFile, mkdir } from 'fs/promises'
import { Storage } from '@google-cloud/storage'

import googleScreenshotBucketConfig from '../config/googleScreenshotBucket'
import { createSafeFolderName } from './pathUtils'

let storage: Storage | null = null

try {
  if (!googleScreenshotBucketConfig.bucketKey) {
    throw new Error('Missing GOOGLE_SCREENSHOT_BUCKET_KEY')
  }
  const credentials = JSON.parse(
    Buffer.from(googleScreenshotBucketConfig.bucketKey, 'base64').toString()
  )
  storage = new Storage({
    credentials,
    projectId: credentials.project_id,
  })
} catch (error) {
  console.error('❌ pdfTools: Error initializing storage')
  storage = null
}

function encodeUriIfNeeded(uri: string): string {
  const decodedUri = decodeURI(uri)
  if (decodedUri === uri) {
    return encodeURI(uri)
  }
  return uri
}

export async function fetchPdf(url: string, headers = {}): Promise<Buffer> {
  const pdfResponse = await fetch(encodeUriIfNeeded(url), { headers })
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
  const fileBytes = Uint8Array.from(buffer)
  formData.append('file', new Blob([fileBytes]), 'document.pdf')
  const url = `${nlmIngestorConfig.url}/api/parseDocument?renderFormat=json`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(6 * 60 * 1000), // 6 minutes
    })
  } catch (err) {
    console.error(
      'Failed to parse PDF with NLM ingestor, have you started the docker container? (' +
        nlmIngestorConfig.url +
        ') Error: ' +
        err.message
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
  tables: Table[]
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

const uploadPageToGoogleCloud = async (
  bucketName: string,
  safeFolderName: string,
  pageNumber: number,
  buffer: Buffer
): Promise<void> => {
  if (!storage) {
    throw new Error('Storage not initialized, skipping pdf upload')
  }

  const bucket = storage.bucket(bucketName)
  const filePath = `${safeFolderName}/page-${pageNumber}.png`
  const file = bucket.file(filePath)
  const [exists] = await file.exists()
  if (!exists) {
    await file.save(buffer, { contentType: 'image/png' })
    console.log('✅ pdfTools: Successfully uploaded to Google Cloud Storage')
  } else {
    console.log('ℹ️ pdfTools: File already exists, skipping upload')
  }
}

const saveScreenshots = async (
  pageScreenshotPath: string,
  buffer: Buffer,
  pdfUrl: string,
  pageNumber: number
): Promise<void> => {
  const tasks = [writeFile(pageScreenshotPath, buffer)]

  if (pdfUrl && pageNumber) {
    tasks.push(
      uploadPageToGoogleCloud(
        googleScreenshotBucketConfig.bucketName,
        createSafeFolderName(pdfUrl),
        pageNumber,
        buffer
      ).catch((error) => {
        console.error(
          `❌ pdfTools: Failed to upload page ${pageNumber} to Google Cloud Storage:`,
          error.message
        )
      })
    )
  }

  await Promise.all(tasks)
}

export async function extractTableScreenshotsFromJson(
  pdf: Buffer,
  json: ParsedDocument,
  outputDir: string,
  searchTerms: string[],
  pdfUrl: string
): Promise<number> {
  const pages = findRelevantTablesGroupedOnPages(json, searchTerms)

  if (!pages.length) return 0

  const width = pages[0].pageWidth * 2
  const height = pages[0].pageHeight * 2

  // creates a pdf converter function from a factory
  const PDFPagetoImageConverter = fromBuffer(pdf, {
    density: 600,
    width,
    height,
    format: 'png',
    preserveAspectRatio: true,
  })

  const reportId = crypto.randomUUID()

  // Process all pages in parallel
  const createScreenshotsPromises = pages.map(async ({ pageIndex }) => {
    const pageNumber = pageIndex + 1

    const result = await PDFPagetoImageConverter(pageNumber, {
      responseType: 'buffer',
    })

    if (!result.buffer) {
      throw new Error(
        `Failed to convert pageNumber ${pageNumber} to an image buffer\n` +
          JSON.stringify(result, null, 2)
      )
    }

    const pageScreenshotPath = path.join(
      outputDir,
      `${reportId}-page-${pageNumber}.png`
    )
    // Save screenshots in parallel (file writing + Google Cloud upload)
    await saveScreenshots(pageScreenshotPath, result.buffer, pdfUrl, pageNumber)
  })

  await Promise.all(createScreenshotsPromises)

  return pages.length

  /* This doesn't work yet because the bounding box is incorrect due to a bug in the NLM ingestor BBOX (see issue here: https://github.com/nlmatics/nlm-ingestor/issues/66).  
            Once it is fixed, this can be used instead to crop just the table rather than the entire page. */
  /* TODO: fix bounding box for tables  
        const { x, y, width, height } = calculateBoundingBoxForTable(
            table,
            pageWidth,
            pageHeight
        )*/
}
