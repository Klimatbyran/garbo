import express from 'express'
import { extractJsonFromPdf } from './lib/pdfTools'
import { jsonToMarkdown } from './lib/jsonExtraction'
import { extractTablesFromJson } from './lib/pdfTools'
import { mkdir } from 'fs/promises'
import path from 'path'
import { openai } from './lib/openai'
import { readFileSync } from 'fs'

const app = express()
const port = 3000

const base64Encode = (filename: string) => {
  const data = readFileSync(path.resolve(filename)).toString('base64')
  return 'data:image/png;base64,' + data
}

const extractTextViaVisionAPI = async (
  {
    filename,
    name,
  }: {
    filename: string
    name: string
  },
  context: string
) => {
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

app.post('/convert', express.raw({type: '*/*', limit: '50mb'}), async (req: express.Request, res: express.Response) => {
  try {
    const buffer = req.body
    const json = await extractJsonFromPdf(buffer)
    const markdown = await jsonToMarkdown(json, buffer)
    res.type('text/plain').send(markdown)
  } catch (error) {
    console.error('Conversion error:', error)
    res.status(500).json({ error: error.message })
    
    // Cleanup temp files
    try {
      await rm('/tmp/pdf2markdown-screenshots', { recursive: true, force: true })
    } catch (cleanupError) {
      console.error('Failed to cleanup temp files:', cleanupError)
    }
  }
})

app.listen(port, () => {
  console.log(`PDF to Markdown service running on port ${port}`)
})
