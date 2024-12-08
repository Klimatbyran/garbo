import { resolve } from 'path'
import { glob, readFile } from 'fs/promises'

import { DoclingDocumentSchema } from './lib/docling-schema'
import assert from 'assert'

const docId = '5ee1f2b6-a86a-4f26-86bc-2223c937528b'
const outDir = resolve(`/tmp/pdf2markdown/${docId}`)

const bufferToBase64 = (buffer: Buffer) => {
  return 'data:image/png;base64,' + buffer.toString('base64')
}

const rawJSON = await readFile(resolve(outDir, 'parsed.json'), {
  encoding: 'utf-8',
}).then(JSON.parse)

const json = DoclingDocumentSchema.parse(rawJSON)

for await (const imagePath of glob(resolve(outDir, 'pages/*.png'))) {
  const image = await readFile(imagePath).then(bufferToBase64)
  const pageNumber = imagePath.match(/(\d+)\.png$/)?.[1]
  if (pageNumber === undefined) {
    throw new Error('Unable to match pageNumber for path: ' + imagePath)
  }

  const page = json.pages[pageNumber]

  if (!page?.image) {
    throw new Error(`Page ${pageNumber} is missing image`)
  }

  assert(
    image === json.pages[pageNumber].image?.uri,
    'Base64 encoded PNG images should match',
  )
}

console.log('All images match!')
