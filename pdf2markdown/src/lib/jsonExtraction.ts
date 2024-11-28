import { Block, ParsedDocument, Table } from './nlm-ingestor-schema'
import { fromBuffer } from 'pdf2pic'
import { openai } from './openai'

const bufferToBase64 = (buffer: Buffer) => {
  return 'data:image/png;base64,' + buffer.toString('base64')
}

export async function extractTextViaVisionAPI(
  {
    buffer,
  }: {
    buffer: Buffer
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
          'This is previous text extracted with a less accurate method:' +
          context,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: bufferToBase64(buffer), detail: 'high' },
          },
        ],
      },
    ],
    max_tokens: 4096,
  })
  if (!result.choices[0]?.message?.content) {
    throw new Error('Failed to get content from Vision API')
  }
  return result.choices[0].message.content
}

export function jsonToTables(json: ParsedDocument): Table[] {
  return json.return_dict.blocks.filter(
    (block): block is Table => 'rows' in block
  )
}

export async function jsonToMarkdown(
  json: ParsedDocument,
  pdf: Buffer
): Promise<string> {
  const blocks = json.return_dict.blocks
  const [pageWidth, pageHeight] = json.return_dict.page_dim

  const markdownBlocks = await Promise.all(
    blocks.map(async (block: Block) => {
      if ('rows' in block) {
        // For tables, convert the page to image and use Vision API
        const pageNumber = block.page_idx + 1
        // Convert page to image
        const pdfConverter = fromBuffer(pdf, {
          density: 600,
          format: 'png',
          width: pageWidth * 2,
          height: pageHeight * 2,
          preserveAspectRatio: true,
        })

        const result = await pdfConverter(pageNumber, {
          responseType: 'buffer',
        })
        if (!result.buffer) {
          throw new Error(`Failed to convert page ${pageNumber} to image`)
        }

        // Extract table text using Vision API
        const markdown = await extractTextViaVisionAPI(
          { buffer: result.buffer },
          block.content
        )
        lastTableMarkdown = markdown
        return markdown
      } else if ('level' in block) {
        const prefix = '#'.repeat(block.level)
        return `${prefix} ${block.content}`
      } else {
        return block.content
      }
    })
  )

  const markdown = markdownBlocks.join('\n\n')

  return markdown
}
