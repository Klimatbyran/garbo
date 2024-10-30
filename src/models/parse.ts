import nlp from 'compromise'
import sharp from 'sharp'
import { pdf } from 'pdf-to-img'

const deHyphenate = (text) => {
  return text
    ? nlp(
        text
          .toString()
          .replace(/\n/g, ' ')
          .replace(/\u2013/g, '-')
      )
        .deHyphenate()
        .normalize()
        .out('text')
    : ''
}

const paragraph = (block) => {
  const sentences = block.sentences.map((sentence, index) => {
    return deHyphenate(sentence)
  })
  return sentences.filter((sentence) => sentence !== '').join('\n')
}
const table = (block) => {
  if (!block.table_rows) return block.name
  const headerRow = block.table_rows?.find((row) => row.type === 'table_header')
  const dataRows = block.table_rows?.filter(
    (row) => row.type !== 'table_header'
  )

  const headers =
    headerRow?.cells.map((cell) => deHyphenate(cell.cell_value)) || []
  const rows = dataRows.map((row) => {
    if (row.type === 'full_row') {
      return [`| ${deHyphenate(row.cell_value)} |`]
    }
    return row.cells.map((cell) => {
      const value = deHyphenate(cell.cell_value)
      return `| ${value}`
    })
  })

  const maxColumns = Math.max(
    headers.length,
    ...rows.map((row) =>
      row.reduce((sum, cell) => sum + (cell.match(/\|/g) || []).length - 1, 0)
    )
  )
  const separator = Array(maxColumns).fill('---')

  const formattedHeaders = `| ${headers.join(' | ')} |`
  const formattedSeparator = `| ${separator.join(' | ')} |`
  const formattedRows = rows.map((row) => row.join(' '))

  return [formattedHeaders, formattedSeparator, ...formattedRows].join('\n')
}
const header = (block) => {
  const level = block.level + 1
  const headerText = block.sentences.join(' ')
  return `${'#'.repeat(level + 1)} ${headerText}`
}

const listItem = (block) => {
  return `- ${block.sentences.join(' ')}`
}

const fullRow = (block) => {
  return deHyphenate(block.cell_value)
}

const blockToMarkdown = (block) => {
  switch (block.tag) {
    case 'para':
      return paragraph(block)
    case 'table':
      return table(block)
    case 'header':
      return header(block)
    case 'list_item':
      return listItem(block)
    case 'full_row':
      return fullRow(block)
    default:
      return ''
  }
}

const jsonToMarkdown = (json) => {
  const blocks = json.return_dict.result.blocks
  const markdown = blocks.map(blockToMarkdown).join('\n\n')
  return markdown
}

const jsonToTables = (json) => {
  const blocks = json.return_dict.result.blocks
  const tables = blocks
    .filter((block) => block.tag === 'table')
    .map((block) => ({ ...block, content: table(block) }))
    .map(({ page_idx, bbox, name, level, content, table_rows }) => ({
      page_idx,
      rows: table_rows,
      bbox,
      name,
      level,
      content,
    }))
  return tables
}

async function getPngsFromPdfPage(stream: NodeJS.ReadableStream) {
  const pages = await pdf(stream, {
    scale: 2,
  })

  return pages
}

async function parsePdfToJson(stream: NodeJS.ReadableStream): Promise<any> {
  const formData = new FormData()
  formData.append('file', stream, 'file.pdf')

  const nlmIngestorUrl = process.env.NLM_INGESTOR_URL || 'http://localhost:5010'
  console.log('parsing pdf from', nlmIngestorUrl)

  const response = await fetch(
    `${nlmIngestorUrl}/api/parseDocument?renderFormat=json`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to parse PDF: ${response.statusText}`)
  }

  return response.json()
}

export async function processPdfAndExtractTables(url: string) {
  console.log('fetching pdf from', url)
  const pdfResponse = await fetch(url)
  if (!pdfResponse.ok) {
    throw new Error(`Failed to fetch PDF from URL: ${pdfResponse.statusText}`)
  }
  console.log('fetched pdf ok')

  const stream = pdfResponse.body

  // Send PDF to NLM ingestor and parse JSON
  const json = await parsePdfToJson(stream)
  console.log('read json')

  // Extract tables from JSON
  const tables = jsonToTables(json).filter(({ content }) =>
    content.toLowerCase().includes('co2')
  )
  const pages = tables.reduce((acc, table) => {
    if (!acc[table.page_idx]) {
      acc[table.page_idx] = []
    }
    acc[table.page_idx].push(table)
    return acc
  }, {})
  console.log('pages', pages)

  // Extract PNGs from PDF pages
  const pngs = await getPngsFromPdfPage(stream)
  console.log('found', pngs.length, pages.length, 'pages')
  const [pageWidth, pageHeight] = json.return_dict.page_dim

  const results = await Promise.all(
    Object.entries(pages).map(async ([pageIndex, tables]) => {
      console.log('extracting tables from page', pageIndex)
      const png = await pngs.getPage(parseInt(pageIndex, 10) + 1)
      console.log('got png. extracting tables from page', pageIndex)
      return Promise.all(
        (tables as any[]).map(async (table) => {
          const { bbox } = table
          const [x1, y1, x2, y2] = bbox
          console.log('x1,y1,x2,y2', x1, y1, x2, y2)
          const padding = 15
          const rowHeight = 45
          const x = Math.round(x1 * 2) - padding
          const y = Math.round(y1 * 2) - padding
          const width = Math.min(
            Math.round(x2 * 2 - x) + padding,
            Math.round(pageWidth * 2 - x) - padding
          )
          const height = Math.min(
            table.rows.length * rowHeight + padding * 2,
            Math.round(pageHeight * 2 - y) - padding
          )
          console.log(url, pageIndex, x, y, width, height, table)

          const outputPath = `output/table-${pageIndex}-${table.name}.png`
          console.log('extracting screenshot to outputPath', outputPath)
          await extractRegionAsPng(png, outputPath, x, y, width, height)
          return { outputPath, ...table }
        })
      )
    })
  )

  return results.flat()
}
  console.log('fetching pdf from', url)
  const pdfResponse = await fetch(url)
  if (!pdfResponse.ok) {
    throw new Error(`Failed to fetch PDF from URL: ${pdfResponse.statusText}`)
  }
  console.log('fetched pdf ok')

  const stream = pdfResponse.body

  const json = await parsePdfToJson(stream)
  console.log('read json')
  const tables = jsonToTables(json).filter(({ content }) =>
    content.toLowerCase().includes('co2')
  )
  const pages = tables.reduce((acc, table) => {
    if (!acc[table.page_idx]) {
      acc[table.page_idx] = []
    }
    acc[table.page_idx].push(table)
    return acc
  }, {})
  console.log('pages', pages)

  const pngs = await getPngsFromPdfPage(stream)
  console.log('found', pngs.length, pages.length, 'pages')
  const [pageWidth, pageHeight] = json.return_dict.page_dim

  const results = await Promise.all(
    Object.entries(pages).map(async ([pageIndex, tables]) => {
      console.log('extracting tables from page', pageIndex)
      const png = await pngs.getPage(parseInt(pageIndex, 10) + 1)
      console.log('got png. extracting tables from page', pageIndex)
      return Promise.all(
        (tables as any[]).map(async (table) => {
          const { bbox } = table
          const [x1, y1, x2, y2] = bbox
          console.log('x1,y1,x2,y2', x1, y1, x2, y2)
          const padding = 15
          const rowHeight = 45
          const x = Math.round(x1 * 2) - padding
          const y = Math.round(y1 * 2) - padding
          const width = Math.min(
            Math.round(x2 * 2 - x) + padding,
            Math.round(pageWidth * 2 - x) - padding
          )
          const height = Math.min(
            table.rows.length * rowHeight + padding * 2,
            Math.round(pageHeight * 2 - y) - padding
          )
          console.log(url, pageIndex, x, y, width, height, table)

          const outputPath = `output/table-${pageIndex}-${table.name}.png`
          console.log('extracting screenshot to outputPath', outputPath)
          await extractRegionAsPng(png, outputPath, x, y, width, height)
          return { outputPath, ...table }
        })
      )
    })
  )

  return results.flat()
}
