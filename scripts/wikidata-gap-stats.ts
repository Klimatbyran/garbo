/**
 * Stats for companies listed as empty/special/impossible in wikidata search specs.
 */
import 'dotenv/config'
import { searchCompany } from '../src/lib/wikidata/read'
import {
  classifyGapRecovery,
  WIKIDATA_SEARCH_TOP_N,
} from '../src/lib/wikidata/searchClassification'
import { listDocumentedGapCases } from '../tests/wikidata/gapCases'

type Bucket = 'empty' | 'special' | 'impossible'
type Case = { name: string; id: string; bucket: Bucket }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function classifyWithRetry(name: string, id: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const results = await searchCompany({ companyName: name })
      return classifyGapRecovery(results, id, WIKIDATA_SEARCH_TOP_N)
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
  const cases = listDocumentedGapCases().filter(
    (c): c is Case & { tag: string } =>
      c.bucket === 'empty' ||
      c.bucket === 'special' ||
      c.bucket === 'impossible'
  )
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
    const status = await classifyWithRetry(c.name, c.id)
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
    `Now in top ${WIKIDATA_SEARCH_TOP_N}: ${results.now_top} (${pct(results.now_top, unique.size)})`
  )
  console.log(
    `Now in results (outside top ${WIKIDATA_SEARCH_TOP_N}): ${results.now_low}`
  )
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
