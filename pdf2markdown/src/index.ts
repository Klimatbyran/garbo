import express, { Request, Response, raw } from 'express'
import { performance } from 'perf_hooks'

import { convertPDF } from './lib/pdfTools'
import { getFileSize } from './lib/util'
// import { jsonToMarkdown } from './lib/jsonExtraction'

const app = express()
const port = 3000

app.post(
  '/convert',
  raw({ type: 'application/pdf', limit: '50mb' }),
  async (req: Request, res: Response) => {
    try {
      const start = performance.now()
      const buffer = Buffer.isBuffer(req.body) ? req.body : null

      if (!buffer) {
        res.status(400).json({
          error:
            'Request body should be a PDF file in binary format. Also set header "Content-Type: application/pdf"',
        })
        return
      } else if (buffer.length === 0) {
        res.status(400).json({ error: 'Empty request body.' })
        return
      }

      console.log(
        'pdf2markdown: Parsing PDF with size',
        getFileSize(Buffer.byteLength(buffer)),
      )

      const docId = crypto.randomUUID()
      const parsed = await convertPDF(buffer, docId)
      // TODO: implement table extraction
      // IDEA: Maybe let docling save the page screenshots, because then we could remove the dependency pdf2pic and several native libs
      // const markdown = await jsonToMarkdown(parsed.json, buffer)

      // use vision API for tables
      // return the Docling parsed markdown, and combine with the more detailed tables
      // maybe: remove tmp files after processing completed successfully to save space
      // Or maybe store a timestamp in the first part of the directory name - and then check if it has passed more than 12h since the report was parsed, then remove it when receiving the next incoming request
      // trigger indexMarkdown after receiving the parsed report back in the garbo container.

      res.type('text/markdown; charset=UTF-8').send(parsed.markdown)

      console.log(
        'Finished conversion in',
        ((performance.now() - start) / 1000).toLocaleString('en-GB', {
          maximumFractionDigits: 2,
        }),
        'sec.',
      )
    } catch (error) {
      console.error('Conversion error:', error)
      res.status(500).json({ error: error.message })
    }
  },
)

app.listen(port, () => {
  console.log('PDF to Markdown service running on port', port)
})
