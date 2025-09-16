import { writeFile } from 'node:fs/promises'

// Local Docling endpoint (uncomment docker-compose.yaml docling service first)
const DOCLING_URL = 'http://localhost:5002'

type DoclingRequest = {
  sources: Array<{
    kind: 'http'
    url: string
    headers: Record<string, never>
  }>
  options: {
    from_formats: string[]
    to_formats: string[]
    image_export_mode: 'placeholder' | 'embedded' | 'referenced'
    do_ocr: boolean
    force_ocr: boolean
    ocr_engine: string
    pdf_backend: string
    table_mode: string
    abort_on_error: boolean
    return_as_file: boolean
    do_table_structure: boolean
    include_images: boolean
    images_scale: number
    do_code_enrichment: boolean
    do_formula_enrichment: boolean
    do_picture_classification: boolean
    do_picture_description: boolean
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms))
}

(async () => {
  const url = process.argv[2] || 'https://vp165.alertir.com/afw/files/press/holmen/202503067047-1.pdf'
  const outPath = process.argv[3] || 'docling-ingest-result.md'

  if (!url || !/^https?:\/\//i.test(url)) {
    console.error('Usage: node --import tsx scripts/docling-ingest-single-report.ts <pdf-url> [out.md]')
    process.exit(1)
  }

  // Try file upload approach for larger PDFs
  console.log('Downloading PDF first...')
  const pdfResponse = await fetch(url)
  if (!pdfResponse.ok) {
    throw new Error(`Failed to download PDF: ${pdfResponse.status} ${pdfResponse.statusText}`)
  }
  const pdfBuffer = await pdfResponse.arrayBuffer()
  
  const formData = new FormData()
  formData.append('files', new Blob([pdfBuffer], { type: 'application/pdf' }), 'document.pdf')
  
  // Add options as form data - temporarily reduced for testing
  const options = {
    from_formats: ['pdf'],
    to_formats: ['md'],
    image_export_mode: 'placeholder', // Reduced memory usage
    do_ocr: false, // Disable OCR temporarily
    force_ocr: false,
    ocr_engine: 'easyocr',
    pdf_backend: 'dlparse_v4',
    table_mode: 'fast',
    abort_on_error: false,
    return_as_file: false,
    do_table_structure: true, // Disable table structure temporarily
    include_images: false, // Disable images temporarily
    images_scale: 1,
    do_code_enrichment: false,
    do_formula_enrichment: false,
    do_picture_classification: false,
    do_picture_description: false,
  }
  
  Object.entries(options).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => formData.append(key, v))
    } else {
      formData.append(key, String(value))
    }
  })
  
  console.log('Uploading PDF to Docling...')
  const startRes = await fetch(`${DOCLING_URL}/v1/convert/file`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(10 * 60 * 1000), // 10 minute timeout
  })
  
  console.log(`Response status: ${startRes.status} ${startRes.statusText}`)
  
  if (!startRes.ok) {
    const body = await startRes.text().catch(() => '')
    throw new Error(`Docling file upload failed: ${startRes.status} ${startRes.statusText} ${body}`)
  }
  
  const result = await startRes.json()
  console.log('Response structure:', JSON.stringify(result, null, 2))
  
  // Extract markdown content from the correct field
  const markdown = result.document?.md_content || result.document?.content || result.content || result.markdown || JSON.stringify(result, null, 2)

  await writeFile(outPath, markdown || '', 'utf-8')
  console.log(`Saved Docling markdown to ${outPath}`)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})


