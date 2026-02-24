import path from 'path'
import { mkdir } from 'fs/promises'
import { extractTableScreenshotsFromJson, fetchPdf } from '../../lib/pdfTools'
import { ParsedDocument } from '../../lib/nlm-ingestor-schema'
import { Logger } from '../../types'

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

export async function createScreenshots(
  json: ParsedDocument,
  url: string,
  logger: Logger
): Promise<void> {
  logger.info('🔍 Searching for relevant tables...')
  const pdf = await fetchPdf(url)
  const outputDir = path.resolve('/tmp', 'garbo-screenshots')
  await mkdir(outputDir, { recursive: true })
  logger.info('✅ PDF downloaded')
  logger.info('🔍 Creating screenshots of tables...')
  const pageCount = await extractTableScreenshotsFromJson(
    pdf,
    json,
    outputDir,
    searchTerms,
    url
  )
  logger.info(
    `🤖 Found relevant tables at ${pageCount} unique pages and made screenshots of them.`
  )

  logger.info(`Extracted ${pageCount} pages`)
}
