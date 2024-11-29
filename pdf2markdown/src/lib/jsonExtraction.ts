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
  return json.return_dict.result.blocks.filter(
    (block): block is Table => 'rows' in block
  )
}

export async function jsonToMarkdown(
  json: ParsedDocument,
  pdf: Buffer
): Promise<string> {
  try {
    // Validate input
    const result = ParsedDocumentSchema.parse(json)
    const blocks = result.return_dict.result.blocks
    
    if (!blocks || blocks.length === 0) {
      console.error('No blocks found in document')
      return 'No content found in document'
    }

    console.log(`Processing ${blocks.length} blocks:`, JSON.stringify(blocks, null, 2))
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
        return markdown
      } else if ('level' in block) {
        console.log('Processing header block:', block)
        if (typeof block.content === 'string' && block.content.trim()) {
          const level = Math.max(1, Math.min(6, block.level + 1)) // Ensure level is between 1-6
          const prefix = '#'.repeat(level)
          return `${prefix} ${block.content.trim()}`
        }
      } else if (block.content) {
        console.log('Processing content block:', block)
        return block.content.trim()
      } else {
        console.log('Skipping empty block:', block)
        return null
      }
    })
  )

    const markdown = (await Promise.all(markdownBlocks))
      .filter(block => block !== null && block !== '')
      .join('\n\n')

    if (!markdown.trim()) {
      console.error('No content was extracted from blocks')
      return 'No content could be extracted from document'
    }

    return markdown
  } catch (error) {
    console.error('Error processing document:', error)
    throw new Error(`Failed to process document: ${error.message}`)
  }
}
