import { Block, ParsedDocument, Table } from './nlm-ingestor-schema'

export function jsonToTables(json: ParsedDocument): Table[] {
  return json.return_dict.blocks.filter(
    (block): block is Table => 'rows' in block
  )
}

export function jsonToMarkdown(json: ParsedDocument): string {
  const blocks = json.return_dict.blocks

  return blocks
    .map((block: Block) => {
      if ('rows' in block) {
        return `Table: ${block.content}`
      } else if ('level' in block) {
        const prefix = '#'.repeat(block.level)
        return `${prefix} ${block.content}`
      } else {
        return block.content
      }
    })
    .join('\n\n')
}
