import express, { Request, Response, raw } from 'express'
import { performance } from 'perf_hooks'

import { extractJsonFromPdf } from './lib/pdfTools'
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

      const parsed = await extractJsonFromPdf(buffer)
      // TODO: implement table extraction
      // IDEA: Maybe let docling save the page screenshots, because then we could remove the dependency pdf2pic and several native libs
      // const markdown = await jsonToMarkdown(parsed.json, buffer)
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
