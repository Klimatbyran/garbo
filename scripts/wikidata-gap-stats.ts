/**
 * Stats for companies listed as empty/special/impossible in wikidata search specs.
 */
import 'dotenv/config'
import { readFileSync } from 'fs'
import { searchCompany } from '../src/lib/wikidata/read'

const TOP = 10
const SPEC_FILES = [
  'tests/wikidata/wikidata-search-company-large-cap.spec.ts',
  'tests/wikidata/wikidata-search-company-small-cap.spec.ts',
  'tests/wikidata/wikidata-search-company-mid-cap.spec.ts',
  'tests/wikidata/wikidata-search-company-public.spec.ts',
  'tests/wikidata/wikidata-search-company-baltics.spec.ts',
]

type Bucket = 'empty' | 'special' | 'impossible'
type Case = { name: string; id: string; bucket: Bucket }

function extractCases(): Case[] {
  const out: Case[] = []
  for (const file of SPEC_FILES) {
    const src = readFileSync(file, 'utf8')
    for (const bucket of ['EMPTY_RESULTS', 'SPECIAL_CASES', 'IMPOSSIBLE_TO_FIND'] as const) {
      const re = new RegExp(`${bucket}:[\\s\\S]*?\\]`)
      const m = src.match(re)
      if (!m) continue
      const rows = [
        ...m[0].matchAll(
          /companyName: '([^']+)'[\s\S]*?klimatkollenWikidataId: '([^']+)'/g
        ),
      ]
      for (const [, name, id] of rows) {
        out.push({
          name,
          id,
          bucket:
            bucket === 'EMPTY_RESULTS'
              ? 'empty'
              : bucket === 'SPECIAL_CASES'
                ? 'special'
                : 'impossible',
        })
      }
    }
  }
  return out
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function classify(name: string, id: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const results = await searchCompany({ companyName: name })
      if (results.length === 0) return 'still_empty' as const
      const topIds = results.slice(0, TOP).map((r) => r.id)
      if (topIds.includes(id)) return 'now_top' as const
      if (results.some((r) => r.id === id)) return 'now_low' as const
      return 'still_missing' as const
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('429') && attempt < 4) {
        await sleep((attempt + 1) * 3000)
        continue
      }
      throw e
    }
  }
  return 'still_empty' as const
}

async function main() {
  const cases = extractCases()
  const unique = new Map<string, Case>()
  for (const c of cases) unique.set(`${c.name}|${c.id}`, c)

  const baseline = {
    empty: [...unique.values()].filter((c) => c.bucket === 'empty').length,
    special: [...unique.values()].filter((c) => c.bucket === 'special').length,
    impossible: [...unique.values()].filter((c) => c.bucket === 'impossible')
      .length,
  }

  const results: Record<string, number> = {
    now_top: 0,
    now_low: 0,
    still_empty: 0,
    still_missing: 0,
  }
  const byBaseline: Record<Bucket, Record<string, number>> = {
    empty: { now_top: 0, now_low: 0, still_empty: 0, still_missing: 0 },
    special: { now_top: 0, now_low: 0, still_empty: 0, still_missing: 0 },
    impossible: { now_top: 0, now_low: 0, still_empty: 0, still_missing: 0 },
  }
  const recovered: string[] = []
  const stillGap: string[] = []

  let i = 0
  for (const c of unique.values()) {
    const status = await classify(c.name, c.id)
    results[status]++
    byBaseline[c.bucket][status]++
    if (status === 'now_top' || status === 'now_low') {
      recovered.push(`${c.name} (${c.bucket} → ${status})`)
    } else {
      stillGap.push(`${c.name} (${c.bucket} → ${status})`)
    }
    i++
    if (i % 10 === 0) console.log(`  ...${i}/${unique.size}`)
    await sleep(1200)
  }

  const pct = (n: number, d: number) =>
    d === 0 ? 'n/a' : `${((n / d) * 100).toFixed(1)}%`

  console.log('\n=== Gap-case baseline (from committed tests) ===')
  console.log(`Unique gap companies: ${unique.size}`)
  console.log(`  empty bucket: ${baseline.empty}`)
  console.log(`  special bucket: ${baseline.special}`)
  console.log(`  impossible bucket: ${baseline.impossible}`)

  console.log('\n=== Current live API (today) ===')
  console.log(
    `Now in top ${TOP}: ${results.now_top} (${pct(results.now_top, unique.size)})`
  )
  console.log(`Now in results (outside top ${TOP}): ${results.now_low}`)
  console.log(`Still no hits: ${results.still_empty}`)
  console.log(`Has hits but not Klimatkollen id: ${results.still_missing}`)
  console.log(
    `Improved (top or low): ${results.now_top + results.now_low} (${pct(results.now_top + results.now_low, unique.size)})`
  )

  for (const bucket of ['empty', 'special', 'impossible'] as Bucket[]) {
    const b = byBaseline[bucket]
    const total = baseline[bucket]
    const improved = b.now_top + b.now_low
    console.log(
      `\n${bucket}: ${improved}/${total} improved (${pct(improved, total)}) — top ${b.now_top}, low ${b.now_low}, empty ${b.still_empty}, missing ${b.still_missing}`
    )
  }

  console.log(`\n=== Recovered (${recovered.length}) ===`)
  recovered.sort().forEach((r) => console.log(`  + ${r}`))
  console.log(`\n=== Still failing (${stillGap.length}) ===`)
  stillGap.sort().forEach((r) => console.log(`  - ${r}`))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
