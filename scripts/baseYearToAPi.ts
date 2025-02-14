import 'dotenv/config'
import { readFile } from 'fs/promises'
import fetch from 'node-fetch'
import { resolve } from 'path'
import apiConfig from '../src/config/api'

const { baseURL, tokens } = apiConfig
const INPUT_FILE = resolve('output', 'base-years.json')

async function companyExists(wikidataId: string): Promise<boolean> {
  const response = await fetch(`${baseURL}/companies/${wikidataId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${tokens[1]}`,
    },
  })
  return response.ok
}

async function updateBaseYear(wikidataId: string, baseYear: number) {
  if (!baseYear) return
  const response = await fetch(`${baseURL}/companies/${wikidataId}/base-year`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens[1]}`,
    },
    body: JSON.stringify({
      baseYear,
      metadata: { comment: 'Base year updated via import script' },
    }),
  })
  if (!response.ok) {
    console.error(`Failed to update ${wikidataId}: ${await response.text()}`)
  }
}

async function main() {
  const companies = JSON.parse(await readFile(INPUT_FILE, 'utf8'))
  for (const { wikidataId, baseYear } of companies) {
    if (baseYear && (await companyExists(wikidataId))) {
      await updateBaseYear(wikidataId, baseYear)
    } else {
      console.log(
        `Skipping ${wikidataId}: Company does not exist or no base year provided`
      )
    }
  }
  console.log('✅ Base years import complete.')
}

main().catch((err) => {
  console.error('Error during processing:', err)
  process.exit(1)
})
