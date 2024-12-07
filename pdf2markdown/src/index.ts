import express from 'express'
import { mkdir } from 'fs/promises'
import { resolve } from 'path'

// import { extractJsonFromPdf } from './lib/pdfTools'
import { jsonToMarkdown } from './lib/jsonExtraction'

export const OUTPUT_DIR = resolve('/tmp/pdf2markdown')

// const app = express()
// const port = 3000

// app.post(
//   '/convert',
//   express.raw({ type: '*/*', limit: '50mb' }),
//   async (req: express.Request, res: express.Response) => {
//     try {
//       const buffer = req.body
//       const docId = crypto.randomUUID()
//       await mkdir(resolve(`/tmp/${docId}`), { recursive: true })

//       const json = await extractJsonFromPdf(buffer, docId)
//       const markdown = await jsonToMarkdown(json, buffer)
//       res.type('text/plain').send(markdown)
//     } catch (error) {
//       console.error('Conversion error:', error)
//       res.status(500).json({ error: error.message })
//     }
//   },
// )

// app.listen(port, () => {
//   console.log(`PDF to Markdown service running on port ${port}`)
// })
