import * as mupdf from 'mupdf'
import * as fs from 'fs'
import * as path from 'path'
 
const EMISSION_KEYWORDS = [
  'scope 1',
  'scope 2',
  'scope 3',
  'tco2e',
  'co2e',
  'greenhouse gas',
  'ghg',
  'emissions',
  'carbon',
  'växthusgaser',
  'utsläpp',
  'koldioxid',
  'klimat',
  'basår',
]
 
function findRelevantPages(pdfBuffer: Buffer): { pages: number[]; text: Record<number, string> } {
  const doc = mupdf.Document.openDocument(pdfBuffer, 'application/pdf')
  const pageCount = doc.countPages()
  const relevant: number[] = []
  const text: Record<number, string> = {}
 
  console.log(`Scanning ${pageCount} pages...`)
 
  for (let i = 0; i < pageCount; i++) {
    const page = doc.loadPage(i)
    const pageText = page.toStructuredText('preserve-whitespace').asText()
    const lower = pageText.toLowerCase()
 
    const matchedKeywords = EMISSION_KEYWORDS.filter((kw) => lower.includes(kw))
 
    if (matchedKeywords.length > 0) {
      relevant.push(i)
      text[i] = pageText
      console.log(`  Page ${i + 1}: matched [${matchedKeywords.join(', ')}]`)
    }
  }
 
  return { pages: relevant, text }
}
 
function saveRelevantPages(
  pdfBuffer: Buffer,
  relevantPages: number[],
  outputPath: string
): void {
  const srcDoc = mupdf.Document.openDocument(pdfBuffer, 'application/pdf')
  const dstDoc = new mupdf.PDFDocument()
 
  for (const pageIndex of relevantPages) {
    dstDoc.graftPage(dstDoc.countPages(), srcDoc as mupdf.PDFDocument, pageIndex)
  }
 
  const outBuffer = Buffer.from(dstDoc.saveToBuffer('compress').asUint8Array())
  fs.writeFileSync(outputPath, outBuffer)
  console.log(`\nSaved ${relevantPages.length} pages → ${outputPath}`)
}
 
async function main() {
  const inputPath = path.resolve('public/atlas-copco-test-report.pdf')
 
  if (!fs.existsSync(inputPath)) {
    console.error(`PDF not found at: ${inputPath}`)
    process.exit(1)
  }
 
  const pdfBuffer = fs.readFileSync(inputPath)
  console.log(`Loaded PDF (${(pdfBuffer.byteLength / 1024 / 1024).toFixed(1)} MB)\n`)
 
  const { pages, text } = findRelevantPages(pdfBuffer)
 
  if (pages.length === 0) {
    console.log('No relevant pages found.')
    process.exit(0)
  }
 
  console.log(`\nFound ${pages.length} relevant pages: [${pages.map((p) => p + 1).join(', ')}]`)
 
  // Save extracted text as JSON for inspection / passing to Docling
  const jsonOutputPath = path.resolve('public/atlas-copco-test-report-relevant-pages.json')
  fs.writeFileSync(
    jsonOutputPath,
    JSON.stringify(
      {
        source: inputPath,
        relevantPageIndices: pages,
        relevantPageNumbers: pages.map((p) => p + 1),
        text,
      },
      null,
      2
    )
  )
  console.log(`Saved page text → ${jsonOutputPath}`)
 
  // Save a new PDF containing only the relevant pages
  const pdfOutputPath = path.resolve('public/atlas-copco-test-report-relevant-pages.pdf')
  saveRelevantPages(pdfBuffer, pages, pdfOutputPath)
}
 
main()