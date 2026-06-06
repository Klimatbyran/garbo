/**
 * Live comparison: main vs 1164 Wikidata search hit rates on Klimatkollen companies.
 * Usage: npx tsx scripts/compare-main-1164-search.ts
 */
import 'dotenv/config'
import { SearchResponse } from 'wikibase-sdk'
import {
  companyRegistry,
  wikidataIdFromEntry,
} from '../src/lib/wikidata/companyRegistry'
import { lookupKnownCompanyWikidataIdFromRegistry } from '../src/lib/wikidata/knownCompanyLookup'
import { searchCompany as search1164 } from '../src/lib/wikidata/read'
import {
  classifySearchHit,
  WIKIDATA_SEARCH_TOP_N,
} from '../src/lib/wikidata/searchClassification'
import { wbk } from '../src/lib/wikidata/util'
import {
  fetchJsonWithRetries,
  WIKIDATA_SEARCH_HEADERS,
} from '../src/lib/wikidata/wikidataHttp'

/** main branch `searchCompany` — single-language sv search, limit 20, no ranking. */
async function searchMain(companyName: string) {
  const url = wbk.searchEntities({
    search: companyName,
    type: 'item',
    language: 'sv',
    limit: 20,
  })
  const response = await fetchJsonWithRetries<SearchResponse>(url, {
    headers: { ...WIKIDATA_SEARCH_HEADERS },
    maxAttempts: 3,
    expectedContentType: 'application/json',
    context: 'Wikidata search (main)',
  })
  if (response.error) {
    throw new Error(`Wikidata search failed: ${response.error.info ?? response.error.code}`)
  }
  return response.search ?? []
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

type Counts = { top: number; low: number; empty: number; total: number }

function bump(counts: Counts, status: 'top' | 'low' | 'empty') {
  counts[status]++
  counts.total++
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await fn()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('429') && attempt < 4) {
        await sleep((attempt + 1) * 3000)
        continue
      }
      throw e
    }
  }
  throw new Error('unreachable')
}

async function main() {
  const companies = Object.entries(companyRegistry)
    .map(([name, entry]) => [name, wikidataIdFromEntry(entry)] as const)
    .sort(([a], [b]) => a.localeCompare(b, 'sv'))

  const mainProd: Counts = { top: 0, low: 0, empty: 0, total: 0 }
  const branchSearch: Counts = { top: 0, low: 0, empty: 0, total: 0 }
  const branchProd: Counts = { top: 0, low: 0, empty: 0, total: 0 }

  const gained: string[] = []
  const lost: string[] = []

  console.log(
    `Comparing ${companies.length} companies (top ${WIKIDATA_SEARCH_TOP_N})...\n`
  )

  let i = 0
  for (const [name, expectedId] of companies) {
    const mainResults = await withRetry(() => searchMain(name))
    const mainStatus = classifySearchHit(mainResults, expectedId)
    bump(mainProd, mainStatus)

    const branchResults = await withRetry(() =>
      search1164({ companyName: name, useKnownIdLookup: false })
    )
    const branchStatus = classifySearchHit(branchResults, expectedId)
    bump(branchSearch, branchStatus)

    const registryHit = lookupKnownCompanyWikidataIdFromRegistry(name)
    if (registryHit === expectedId) {
      bump(branchProd, 'top')
    } else {
      const prodResults = await withRetry(() =>
        search1164({ companyName: name, useKnownIdLookup: true })
      )
      bump(branchProd, classifySearchHit(prodResults, expectedId))
    }

    const mainOk = mainStatus === 'top' || mainStatus === 'low'
    const branchOk = branchStatus === 'top' || branchStatus === 'low'
    if (!mainOk && branchOk) gained.push(name)
    if (mainOk && !branchOk) lost.push(name)

    i++
    if (i % 25 === 0) console.log(`  ...${i}/${companies.length}`)
    await sleep(1200)
  }

  const pct = (n: number, d: number) =>
    d === 0 ? 'n/a' : `${((n / d) * 100).toFixed(1)}%`

  const resolvable = (c: Counts) => c.top + c.low

  console.log('\n=== Summary ===')
  console.log(
    `main (search only, default sv, limit 20): top ${mainProd.top} (${pct(mainProd.top, mainProd.total)}), low ${mainProd.low}, miss ${mainProd.empty} — resolvable ${resolvable(mainProd)} (${pct(resolvable(mainProd), mainProd.total)})`
  )
  console.log(
    `1164 (search only, default en + ranking): top ${branchSearch.top} (${pct(branchSearch.top, branchSearch.total)}), low ${branchSearch.low}, miss ${branchSearch.empty} — resolvable ${resolvable(branchSearch)} (${pct(resolvable(branchSearch), branchSearch.total)})`
  )
  console.log(
    `1164 (production: registry + search): top ${branchProd.top} (${pct(branchProd.top, branchProd.total)}), low ${branchProd.low}, miss ${branchProd.empty} — resolvable ${resolvable(branchProd)} (${pct(resolvable(branchProd), branchProd.total)})`
  )

  console.log(`\nGained vs main search (${gained.length}):`)
  gained.sort((a, b) => a.localeCompare(b, 'sv')).forEach((n) => console.log(`  + ${n}`))
  console.log(`\nLost vs main search (${lost.length}):`)
  lost.sort((a, b) => a.localeCompare(b, 'sv')).forEach((n) => console.log(`  - ${n}`))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
