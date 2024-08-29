import fs from 'fs'
import nlp from 'compromise'

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

const run = async () => {
  const example = fs.readFileSync('test.json', 'utf-8')
  const json = JSON.parse(example)
  const markdown = jsonToMarkdown(json)
  console.log(markdown)
}

run()
