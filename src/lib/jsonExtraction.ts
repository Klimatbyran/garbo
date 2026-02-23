import nlp from 'compromise'
import {
  Block,
  Header,
  Paragraph,
  Table as NLMIngestorTable,
  ListItem,
  ParsedDocument,
} from './nlm-ingestor-schema'
import { parseTable } from './tableParser'

const deHyphenate = (text: string) => {
  return text
    ? nlp(
        text
          .toString()
          .replace(/\n/g, ' ')
          .replace(/\u2013/g, '-'),
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

export const table = (block: NLMIngestorTable) => {
  return parseTable(block)
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
  table: Table,
  pageWidth: number,
  pageHeight: number,
) => {
  const { bbox } = table
  const [x1, y1, x2] = bbox
  const padding = 15
  const rowHeight = 45
  const x = Math.round(x1 * 2) - padding
  const y = Math.round(y1 * 2) - padding
  const width = Math.min(
    Math.round(x2 * 2 - x) + padding,
    Math.round(pageWidth * 2 - x) - padding,
  )
  const height = Math.min(
    table.rows.length * rowHeight + padding * 2, // TODO: remove when the BBOX bug is fixed
    Math.round(pageHeight * 2 - y) - padding,
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
    { markdown: '', pageNr: 0 },
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
        }) as Table,
    )
  return tables
}

export type Table = {
  page_idx: number
  rows: object[]
  bbox: number[]
  name: string
  level: number
  content: string
  markdown?: string
}
