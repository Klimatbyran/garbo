import nlp from 'compromise'
import {
  Block,
  Cell,
  Header,
  Paragraph,
  Table as NLMIngestorTable,
  ListItem,
  ParsedDocument,
} from './nlm-ingestor-schema'

const deHyphenate = (text: string) => {
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

const paragraph = (block: { tag: 'para'; sentences: string[] }) =>
  block.sentences
    .map((sentence) => deHyphenate(sentence))
    .filter((sentence) => sentence !== '')
    .join('\n')

const getCellValueString = (cell: Cell): string =>
  typeof cell.cell_value === 'string'
    ? cell.cell_value
    : cell.cell_value.sentences.join(' ')

const table = (block: NLMIngestorTable) => {
  if (!block.table_rows) return block.name
  const headerRow = block.table_rows?.find((row) => row.type === 'table_header')
  const dataRows = block.table_rows?.filter(
    (row) => row.type !== 'table_header'
  )

  const headers =
    headerRow?.cells?.map((cell) => deHyphenate(getCellValueString(cell))) || []
  const rows = dataRows
    .map((row) => {
      if (row.type === 'full_row') {
        return [`| ${deHyphenate(row.cell_value ?? '')} |`]
      }
      return row.cells?.map?.((cell) => {
        const value = deHyphenate(getCellValueString(cell))
        return `| ${value}`
      })
    })
    .filter((row) => row !== undefined)

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
  const bbox = block.bbox

  // NOTE: Some tables include neither `bbox` nor `table_rows`
  const image = bbox
    ? `![table image]({page: ${block.page_idx}, x: ${Math.round(
        bbox[0]
      )}}, {y: ${Math.round(bbox[1])}, {width: ${Math.round(
        bbox[2] - bbox[0]
      )}}, {height: ${Math.round(bbox[3] - bbox[1])}})`
    : ''

  return [formattedHeaders, formattedSeparator, ...formattedRows, image].join(
    '\n'
  )
}
const header = (block: Header) => {
  const level = block.level + 1
  const headerText = block.sentences.join(' ')
  return `${'#'.repeat(level + 1)} ${headerText}`
}

const listItem = (block: ListItem) => {
  return `- ${block.sentences.join(' ')}`
}

const blockToMarkdown = (block: Block) => {
  switch (block.tag) {
    case 'para':
      return paragraph(block as Paragraph)
    case 'table':
      return table(block as NLMIngestorTable)
    case 'header':
      return header(block as Header)
    case 'list_item':
      return listItem(block as ListItem)
    default:
      return ''
  }
}

export const calculateBoundingBoxForTable = (
  table: any,
  pageWidth: number,
  pageHeight: number
) => {
  const { bbox } = table
  const [x1, y1, x2, y2] = bbox
  const padding = 15
  const rowHeight = 45
  const x = Math.round(x1 * 2) - padding
  const y = Math.round(y1 * 2) - padding
  const width = Math.min(
    Math.round(x2 * 2 - x) + padding,
    Math.round(pageWidth * 2 - x) - padding
  )
  const height = Math.min(
    table.rows.length * rowHeight + padding * 2, // TODO: remove when the BBOX bug is fixed
    Math.round(pageHeight * 2 - y) - padding
  )
  return { x, y, width, height }
}

export const jsonToMarkdown = (json: ParsedDocument): string => {
  const blocks = json.return_dict.result.blocks
  const { markdown } = blocks.reduce(
    ({ markdown, pageNr }, block) => {
      const currentPage = block.page_idx
      if (currentPage !== pageNr) {
        markdown += `\n<!-- PAGE: ${currentPage} -->\n`
      }
      markdown += blockToMarkdown(block) + '\n\n'
      return { pageNr: currentPage, markdown }
    },
    { markdown: '', pageNr: 0 }
  )
  return markdown
}

export const jsonToTables = (json: ParsedDocument) => {
  const blocks = json.return_dict.result.blocks
  const tables = blocks
    .filter((block) => block.tag === 'table')
    .map((block) => ({ ...block, content: table(block as NLMIngestorTable) }))
    .map(
      ({ page_idx, bbox, name, level, content, table_rows }) =>
        ({
          page_idx,
          rows: table_rows,
          bbox,
          name,
          level,
          content,
        } as Table)
    )
  return tables
}

export type Table = {
  page_idx: number
  rows: any[]
  bbox: number[]
  name: string
  level: number
  content: string
  markdown?: string
}

export type TableWithFilename = Table & { filename: string }
