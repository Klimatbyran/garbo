import { parseArgs } from 'node:util'
import readline from 'node:readline'

import { isMainModule } from './utils'
import { vectorDB } from '../src/lib/vectordb'

function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) =>
    rl.question(message, (answer) => {
      if (answer === 'y') {
        resolve(true)
      }
      rl.close()
      resolve(false)
    })
  )
}

async function main() {
  const { values } = parseArgs({
    options: {
      url: { type: 'string' as const },
      yes: { type: 'boolean' as const, default: false },
    },
  })

  const url = values.url
  const skipConfirm = Boolean(values.yes)

  if (!url) {
    console.error('Missing required argument: --url <REPORT_URL>')
    process.exit(1)
  }

  const exists = await vectorDB.hasReport(url)
  if (!exists) {
    console.log(`No Chroma entries found for URL: ${url}`)
    process.exit(0)
  }

  if (!skipConfirm) {
    const ok = await confirm(
      `Delete ALL Chroma entries for this URL?\n${url}\n(y/N) `
    )
    if (!ok) {
      console.log('Aborted')
      process.exit(0)
    }
  }

  await vectorDB.deleteReport(url)

  const stillExists = await vectorDB.hasReport(url)
  if (stillExists) {
    console.error('Failed to delete entries for URL:', url)
    process.exit(2)
  }

  console.log('Deleted Chroma entries for URL:', url)
}

if (isMainModule(import.meta.url)) {
  await main()
}
