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
import { logToFile } from './logUtils'

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

    export const table = (block: NLMIngestorTable, job: any) => {
      if (!block.table_rows || block.table_rows.length === 0) return block.name
    
      console.log('table is now parsed: ', block)
      job.log('table is now parsed: ', JSON.stringify(block, null, 2))
      logToFile('table is now parsed', block, job?.id, 'table-parsing.log')
    
      const headerRows = block.table_rows?.filter((row) => row.type === 'table_header') || []
      const dataRows = block.table_rows?.filter(
        (row) => row.type !== 'table_header'
      )
    
      // Build multi-level headers
      const formattedHeaders: string[] = []
      
      if (headerRows.length > 0) {
        // Use the LAST header row as the actual table header (most detailed)
        const mainHeaderRow = headerRows[headerRows.length - 1]
        const headers = mainHeaderRow?.cells?.map(cell => getCellValueString(cell)) || []
        
        formattedHeaders.push(`| ${headers.join(' | ')} |`)
        
        // Add separator
        const separator = Array(headers.length).fill('---')
        formattedHeaders.push(`| ${separator.join(' | ')} |`)
        
        // Add other header rows as regular data rows (grouping info)
        for (let i = 0; i < headerRows.length - 1; i++) {
          const groupingHeaders: string[] = []
          
          headerRows[i].cells?.forEach((cell) => {
            const value = getCellValueString(cell)
            const colSpan = cell.col_span || 1
            
            // Expand column spans
            for (let j = 0; j < colSpan; j++) {
              groupingHeaders.push(value)
            }
          })
          
          // Pad to match main header length
          while (groupingHeaders.length < headers.length) {
            groupingHeaders.push('')
          }
          
          formattedHeaders.push(`| ${groupingHeaders.join(' | ')} |`)
        }
      }
    
      // Build the result array
      const result: string[] = [...formattedHeaders]
    
      // Process data rows
      dataRows.forEach((row) => {
        if (row.type === 'full_row') {
          // Add full-width section header
          result.push(`| ${row.cell_value ?? ''} |`)
        } else {
          // Add regular data row
          const cells = row.cells?.map((cell) => getCellValueString(cell)) || []
          result.push(`| ${cells.join(' | ')} |`)
        }
      })
    
      // Add image if bbox exists
      const bbox = block.bbox
      const image = bbox
        ? `![table image]({page: ${block.page_idx}, x: ${Math.round(
            bbox[0]
          )}}, {y: ${Math.round(bbox[1])}, {width: ${Math.round(
            bbox[2] - bbox[0]
          )}}, {height: ${Math.round(bbox[3] - bbox[1])}})`
        : ''
    
      if (image) result.push(image)
    
      const finalResult = result.join('\n')
      
      job.log('table result: ', JSON.stringify(finalResult, null, 2))
      console.log('table result: ', finalResult)
      logToFile('table result', finalResult, job?.id, 'table-parsing.log')
      
      return finalResult
    }
const header = (block: Header) => {
  const level = block.level + 1
  const headerText = block.sentences.join(' ')
  return `${'#'.repeat(level + 1)} ${headerText}`
}

const listItem = (block: ListItem) => {
  return `- ${block.sentences.join(' ')}`
}

const blockToMarkdown = (block: Block, job: any) => {
  switch (block.tag) {
    case 'para':
      return paragraph(block as Paragraph)
    case 'table':
      return table(block as NLMIngestorTable, job)
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
  pageHeight: number
) => {
  const { bbox } = table
  const [x1, y1, x2] = bbox
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

export const jsonToMarkdown = (json: ParsedDocument, job: any): string => {
  const blocks = json.return_dict.result.blocks
  const { markdown } = blocks.reduce(
    ({ markdown, pageNr }, block) => {
      const currentPage = block.page_idx
      if (currentPage !== pageNr) {
        markdown += `\n<!-- PAGE: ${currentPage} -->\n`
      }
      markdown += blockToMarkdown(block, job) + '\n\n'
      return { pageNr: currentPage, markdown }
    },
    { markdown: '', pageNr: 0 }
  )
  return markdown
}

export const jsonToTables = (json: ParsedDocument, job: any) => {
  const blocks = json.return_dict.result.blocks
  const tables = blocks
    .filter((block) => block.tag === 'table')
    .map((block) => ({ ...block, content: table(block as NLMIngestorTable, job) }))
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
  rows: object[]
  bbox: number[]
  name: string
  level: number
  content: string
  markdown?: string
}
