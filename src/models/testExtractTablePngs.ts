import { extractTablePngsFromPDF } from './parse'

async function testExtractTablePngs() {
  const url = 'src/models/test.pdf'
  try {
    const results = await extractTablePngsFromPDF(url)
    console.log('Extracted tables:', results)
  } catch (error) {
    console.error('Error extracting tables:', error)
  }
}

testExtractTablePngs()
