import { readFileSync } from 'fs'
import path from 'path'
import { Block, ParsedDocument, Table } from './nlm-ingestor-schema'
import { fromBuffer } from 'pdf2pic'
import { openai } from './openai'
import { mkdir, writeFile } from 'fs/promises'

const base64Encode = (filename: string) => {
  const data = readFileSync(path.resolve(filename)).toString('base64')
  return 'data:image/png;base64,' + data
}

export async function extractTextViaVisionAPI(
  {
    filename,
    name,
  }: {
    filename: string
    name: string
  },
  context: string
) {
  const result = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'system',
        content:
          'You are a CSRD expert and will extract text from a PDF with extract from the tables.',
      },
      {
        role: 'user',
        content: `I have a PDF with couple of tables related to a company's CO2 emissions. Can you extract the text from screenshot. I will send you the screenshot extract the header and table contents and ignore the surrounding text if they are not related to the tables/graphs (such as header, description, footnotes or disclaimers). Use Markdown format for the table(s), only reply with markdown. OK?`,
      },
      {
        role: 'assistant',
        content:
          'Sure. Sounds good. Send the screenhot and I will extract the table(s) and return in markdown format as accurately as possible without any other comment.',
      },
      {
        role: 'assistant',
        content:
          'This is previous table extracted from previous pages:' + context,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: base64Encode(filename), detail: 'high' },
          },
        ],
      },
    ],
    max_tokens: 4096,
  })
  return result.choices[0].message.content
}

export function jsonToTables(json: ParsedDocument): Table[] {
  return json.return_dict.blocks.filter(
    (block): block is Table => 'rows' in block
  )
}

export async function jsonToMarkdown(json: ParsedDocument, pdf: Buffer): Promise<string> {
  const blocks = json.return_dict.blocks
  const [pageWidth, pageHeight] = json.return_dict.page_dim
  const outputDir = path.resolve('/tmp', 'pdf2markdown-screenshots')
  await mkdir(outputDir, { recursive: true })
  
  const reportId = crypto.randomUUID()
  let lastTableMarkdown = ''

  const markdownBlocks = await Promise.all(blocks.map(async (block: Block) => {
    if ('rows' in block) {
      // For tables, convert the page to image and use Vision API
      const pageNumber = block.page_idx + 1
      const pageScreenshotPath = path.join(
        outputDir,
        `${reportId}-page-${pageNumber}.png`
      )

      // Convert page to image
      const pdfConverter = fromBuffer(pdf, {
        density: 600,
        format: 'png',
        width: pageWidth * 2,
        height: pageHeight * 2,
        preserveAspectRatio: true,
      })
      
      const result = await pdfConverter(pageNumber, { responseType: 'buffer' })
      if (!result.buffer) {
        throw new Error(`Failed to convert page ${pageNumber} to image`)
      }
      
      await writeFile(pageScreenshotPath, result.buffer)
      
      // Extract table text using Vision API
      const markdown = await extractTextViaVisionAPI(
        { filename: pageScreenshotPath, name: `Table from page ${pageNumber}` },
        lastTableMarkdown
      )
      lastTableMarkdown = markdown
      return markdown
    } else if ('level' in block) {
      const prefix = '#'.repeat(block.level)
      return `${prefix} ${block.content}`
    } else {
      return block.content
    }
  }))

  return markdownBlocks.join('\n\n')
}
