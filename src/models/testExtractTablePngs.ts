import { extractTablesFromPDF, fetchPdf } from '../lib/pdfTools'

async function testExtractTablePngs() {
  const url =
    'https://hmgroup.com/wp-content/uploads/2024/03/HM-Group-Annual-and-Sustainability-Report-2023.pdf'
  try {
    const pdf = await fetchPdf(url)
    const results = await extractTablesFromPDF(pdf, 'output', 'co2')
    console.log('Extracted tables:', results)
  } catch (error) {
    console.error('Error extracting tables:', error)
  }
}

testExtractTablePngs()
