/**
 * Classify Wikidata search hit rate for Klimatkollen companies.
 * Usage: npx tsx scripts/wikidata-search-stats.ts
 */
import 'dotenv/config'
import { companiesWithTag } from '../src/lib/wikidata/companyRegistry'
import { searchCompany } from '../src/lib/wikidata/read'
import {
  classifySearchHit,
  WIKIDATA_SEARCH_TOP_N,
} from '../src/lib/wikidata/searchClassification'

const TAGS = [
  'large-cap',
  'small-cap',
  'mid-cap',
  'public',
  'state-owned',
  'private',
  'baltics',
  'municipality-owned',
] as const

type Status = 'top' | 'low' | 'empty'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const cache = new Map<string, Status>()
  const global = { top: 0, low: 0, empty: 0, total: 0 }
  const byTag: Record<
    string,
    { top: number; low: number; empty: number; total: number }
  > = {}

  const unique = new Map<string, string[]>()
  for (const tag of TAGS) {
    for (const [name, id] of companiesWithTag(tag)) {
      const key = `${name}|${id}`
      const tagList = unique.get(key) ?? []
      tagList.push(tag)
      unique.set(key, tagList)
    }
  }

  console.log(`Classifying ${unique.size} unique companies (live API)...\n`)

  let i = 0
  for (const [key, tagList] of unique) {
    const [name, id] = key.split('|')
    const results = await searchCompany({ companyName: name })
    const status = classifySearchHit(results, id, WIKIDATA_SEARCH_TOP_N)
    cache.set(key, status)
    global[status]++
    global.total++
    for (const tag of tagList) {
      if (!byTag[tag]) byTag[tag] = { top: 0, low: 0, empty: 0, total: 0 }
      byTag[tag][status]++
      byTag[tag].total++
    }
    i++
    if (i % 25 === 0) {
      console.log(`  ...${i}/${unique.size}`)
    }
    await sleep(200)
  }

  const pct = (n: number, d: number) =>
    d === 0 ? 'n/a' : `${((n / d) * 100).toFixed(1)}%`

  console.log('\n=== Global (unique companies) ===')
  console.log(`Total: ${global.total}`)
  console.log(
    `In top ${WIKIDATA_SEARCH_TOP_N}: ${global.top} (${pct(global.top, global.total)})`
  )
  console.log(`In results (not top ${WIKIDATA_SEARCH_TOP_N}): ${global.low}`)
  console.log(
    `Not found / wrong id only: ${global.empty} (${pct(global.empty, global.total)})`
  )
  console.log(
    `Resolvable (top or low): ${global.top + global.low} (${pct(global.top + global.low, global.total)})`
  )

  console.log('\n=== By tag ===')
  for (const tag of TAGS) {
    const s = byTag[tag] ?? { top: 0, low: 0, empty: 0, total: 0 }
    console.log(
      `${tag.padEnd(20)} total=${String(s.total).padStart(3)}  top=${String(s.top).padStart(3)} (${pct(s.top, s.total).padStart(6)})  low=${String(s.low).padStart(2)}  empty=${String(s.empty).padStart(2)}`
    )
  }

  const emptyNames = [...cache.entries()]
    .filter(([, st]) => st === 'empty')
    .map(([key]) => key.split('|')[0])
    .sort((a, b) => a.localeCompare(b, 'sv'))

  console.log(`\n=== Still empty (${emptyNames.length}) ===`)
  for (const name of emptyNames) console.log(`  - ${name}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
