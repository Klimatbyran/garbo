import { Table as NLMIngestorTable } from './nlm-ingestor-schema'

const getCellValueString = (cell: any): string =>
  typeof cell.cell_value === 'string'
    ? cell.cell_value
    : cell.cell_value.sentences.join(' ')

const validateTableBlock = (block: NLMIngestorTable): boolean => {
  return !!(block.table_rows && block.table_rows.length > 0)
}

const separateHeaderAndDataRows = (tableRows: any[]) => {
  const headerRows =
    tableRows.filter((row) => row.type === 'table_header') || []
  const dataRows = tableRows.filter((row) => row.type !== 'table_header')
  return { headerRows, dataRows }
}

const findMostDetailedHeaderRow = (headerRows: any[]): any => {
  if (headerRows.length === 0) return null

  // If there's only one header row, return it immediately
  if (headerRows.length === 1) return headerRows[0]

  // Find the header row with the most detailed information
  // Prioritize headers with years
  let mostDetailedRow = headerRows[0]
  let maxDetailScore = 0

  headerRows.forEach((row) => {
    let yearScore = 0

    const uniqueTexts = new Set<string>()

    row.cells?.forEach((cell: any) => {
      const text = getCellValueString(cell)
      uniqueTexts.add(text.trim())

      if (
        /\b(1[89]\d{2}|20[0-9]\d|21\d{2})\b/.test(text) || // 1800-2199
        /\b'\d{2}\b/.test(text) || // '99, '03
        /\b(19|20)\d{2}s?\b/.test(text)
      ) {
        // 1990s
        yearScore += 50
      }
    })

    // Score based on: years (highest priority) > unique content diversity
    const uniqueContentScore = uniqueTexts.size * 10 // More unique content = better, 10 points per unique text
    const detailScore = yearScore + uniqueContentScore

    if (detailScore > maxDetailScore) {
      // this row is currently leading the pack, so we'll use it as the main header row
      maxDetailScore = detailScore
      mostDetailedRow = row
    }
  })

  return mostDetailedRow
}

const createMainHeaderRow = (headerRows: any[]): string => {
  if (headerRows.length === 0) return ''

  // Use the most detailed header row as the actual table header
  const mainHeaderRow = findMostDetailedHeaderRow(headerRows)
  const headers =
    mainHeaderRow?.cells?.map((cell) => getCellValueString(cell)) || []

  return `| ${headers.join(' | ')} |`
}

const createHeaderSeparator = (headerCount: number): string => {
  const separator = Array(headerCount).fill('---')
  return `| ${separator.join(' | ')} |`
}

const expandColumnSpans = (cell: any): string[] => {
  const value = getCellValueString(cell)
  const colSpan = cell.col_span || 1

  // Expand column spans
  const expandedCells: string[] = []
  for (let j = 0; j < colSpan; j++) {
    expandedCells.push(value)
  }
  return expandedCells
}

// grouping headers are headers that span multiple columns, like first three columns are 'retrospective' or something.
// this has bad support in markdown rendering since most can just handle one header and then the separator
// so we add the grouping headers as regular rows at the start of the table instead for now.
const createGroupingHeaderRows = (
  headerRows: any[],
  mainHeaderRow: any,
): string[] => {
  const groupingRows: string[] = []

  // Add all header rows except the most detailed one as regular data rows (grouping info)
  headerRows.forEach((row) => {
    // Skip the most detailed header row (it becomes the actual table header)
    if (row === mainHeaderRow) return

    const groupingHeaders: string[] = []

    row.cells?.forEach((cell: any) => {
      const expandedCells = expandColumnSpans(cell)
      groupingHeaders.push(...expandedCells)
    })

    // Pad to match main header length
    const mainHeaderLength = mainHeaderRow?.cells?.length || 0
    while (groupingHeaders.length < mainHeaderLength) {
      groupingHeaders.push('')
    }

    groupingRows.push(`| ${groupingHeaders.join(' | ')} |`)
  })

  return groupingRows
}

const processDataRows = (dataRows: any[]): string[] => {
  return dataRows.map((row) => {
    if (row.type === 'full_row') {
      // Add full-width section header
      return `| ${row.cell_value ?? ''} |`
    } else {
      // Add regular data row
      const cells =
        row.cells?.map((cell: any) => getCellValueString(cell)) || []
      return `| ${cells.join(' | ')} |`
    }
  })
}

const createTableImage = (block: NLMIngestorTable): string => {
  const bbox = block.bbox
  if (!bbox) return ''

  return `![table image]({page: ${block.page_idx}, x: ${Math.round(
    bbox[0],
  )}}, {y: ${Math.round(bbox[1])}, {width: ${Math.round(
    bbox[2] - bbox[0],
  )}}, {height: ${Math.round(bbox[3] - bbox[1])}})`
}

export const parseTable = (block: NLMIngestorTable) => {
  // Early return if table is invalid
  if (!validateTableBlock(block)) return block.name
  // Separate header and data rows
  const { headerRows, dataRows } = separateHeaderAndDataRows(
    block.table_rows || [],
  )

  // Build multi-level headers
  const formattedHeaders: string[] = []

  if (headerRows.length > 0) {
    // Find the most detailed header row to use as the main table header
    const mostDetailedHeaderRow = findMostDetailedHeaderRow(headerRows)

    // Create main header row
    const mainHeaderRow = createMainHeaderRow(headerRows)
    formattedHeaders.push(mainHeaderRow)

    // Add separator
    const mainHeaderLength = mostDetailedHeaderRow?.cells?.length || 0
    const separator = createHeaderSeparator(mainHeaderLength)
    formattedHeaders.push(separator)

    // Add grouping header rows (all other header rows as data rows)
    const groupingRows = createGroupingHeaderRows(
      headerRows,
      mostDetailedHeaderRow,
    )
    formattedHeaders.push(...groupingRows)
  }

  // Build the complete result
  const dataRowsFormatted = processDataRows(dataRows)
  const result: string[] = [...formattedHeaders, ...dataRowsFormatted]

  // Add table image if available
  const image = createTableImage(block)
  if (image) result.push(image)

  const finalResult = result.join('\n')

  return finalResult
}
