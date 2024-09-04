import fs from 'fs'
import nlp from 'compromise'
import sharp from 'sharp'
import { PDFDocument } from 'pdf-lib'
import pdf2img from 'pdf-img-convert'

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
    .map(({ page_idx, bbox, name, level, content }) => ({
      page_idx,
      bbox,
      name,
      level,
      content,
    }))
  return tables
}

async function getPngsFromPdfPage(url, pageIndex) {
  // Ladda PDF-dokumentet
  const pages = await pdf2img.convert(url, {
    scale: 2,
  })

  return pages
}

async function extractRegionAsPng(png, outputPath, x, y, width, height) {
  // Ladda PDF-dokumentet
  // Använd `sharp` för att beskära och spara regionen
  await sharp(png)
    .extract({ left: x, top: y, width: width, height: height })
    .toFile(outputPath)
}

const run = async () => {
  const example = fs.readFileSync('test.json', 'utf-8')
  const json = JSON.parse(example)
  //const markdown = jsonToMarkdown(json)
  const tables = jsonToTables(json).filter(
    ({ content }) =>
      content.toLowerCase().includes('ghg') ||
      content.toLowerCase().includes('co2')
  )
  // Group pages
  const pages = tables.reduce((acc, table) => {
    if (!acc[table.page_idx]) {
      acc[table.page_idx] = []
    }
    acc[table.page_idx].push(table)
    return acc
  }, {})

  const pdfPath = 'test.pdf'
  const pngs = await getPngsFromPdfPage(pdfPath)

  // Extract tables as PNG
  Object.entries(pages)
    .slice(0, 1)
    .map(async ([pageIndex, tables]) => {
      const png = pngs.at(pageIndex + 1) // page 0 is the first page
      // For each table on this page, extract the region as PNG
      Promise.all(
        tables.slice(0, 1).map(async (table) => {
          const { bbox } = table
          const [x1, y1, x2, y2] = bbox
          const x = Math.round(x1 * 2)
          const y = Math.round(y1 * 2)
          const width = Math.round(x2 * 2) - x
          const height = Math.round(y2 * 2) - y
          console.log(pdfPath, pageIndex, x, y, width, height, table)

          const outputPath = `output/table-${pageIndex}-${table.name}.png`
          return extractRegionAsPng(png, outputPath, x, y, width, height)
        })
      )
    })
}

run()
