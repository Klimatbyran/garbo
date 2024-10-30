import { extractTablesFromPDF } from './parse'

async function testExtractTablePngs() {
  const url =
    'https://hmgroup.com/wp-content/uploads/2024/03/HM-Group-Annual-and-Sustainability-Report-2023.pdf'
  try {
    const results = await extractTablesFromPDF(url, 'output', 'co2')
    console.log('Extracted tables:', results)
  } catch (error) {
    console.error('Error extracting tables:', error)
  }
}

testExtractTablePngs()
