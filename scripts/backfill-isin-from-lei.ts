/**
 * Backfill CompanyIdentifier ISIN rows from GLEIF using each company's LEI.
 *
 * Write policy matches the pipeline (see doc/ISIN_IDENTIFIERS_PLAN.md):
 * - exactly one valid GLEIF ISIN → upsert (unverified)
 * - zero or many → skip
 * - never overwrite an existing ISIN
 *
 * Usage:
 *   npx tsx scripts/backfill-isin-from-lei.ts --dry-run
 *   npx tsx scripts/backfill-isin-from-lei.ts
 *   npx tsx scripts/backfill-isin-from-lei.ts --limit=50
 *
 * Throttles to stay under GLEIF's ~60 req/min guideline.
 */

import 'dotenv/config'
import { parseArgs } from 'node:util'

import { prisma } from '../src/lib/prisma'
import { getIsinsForLei } from '../src/lib/gleif'
import { selectUniqueIsinForAutoWrite } from '../src/lib/isinOwnership'
import { normalizeLei } from '../src/lib/normalizeLei'
import { companyIdentifierService } from '../src/api/services/companyIdentifierService'
import {
  GARBO_SERVICE_CLIENT_ID,
  getOrCreateServiceBotUser,
} from '../src/api/services/serviceBotUser'

const GLEIF_METADATA = {
  source: 'gleif-lei-isins',
  comment: 'Backfill from LEI via GLEIF ISIN relationship API',
} as const

const { values } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    limit: { type: 'string' },
    /** Milliseconds between GLEIF calls (default 1200 ≈ 50/min). */
    delayMs: { type: 'string' },
  },
})

const dryRun = values['dry-run'] ?? false
const limit = values.limit ? Number(values.limit) : undefined
const delayMs = values.delayMs ? Number(values.delayMs) : 1200

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      lei: true,
      identifiers: {
        where: { type: { in: ['LEI', 'ISIN'] } },
        select: { type: true, value: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  const candidates = companies
    .map((company) => {
      const existingIsin = company.identifiers.find((row) => row.type === 'ISIN')
      const lei =
        normalizeLei(company.lei) ??
        normalizeLei(
          company.identifiers.find((row) => row.type === 'LEI')?.value
        )
      return { company, lei, existingIsin }
    })
    .filter((row) => row.lei && !row.existingIsin)

  const work = Number.isFinite(limit)
    ? candidates.slice(0, limit as number)
    : candidates

  console.info(
    `Companies with LEI and no ISIN: ${candidates.length}; processing ${work.length} (dryRun=${dryRun})`
  )

  const user = dryRun
    ? null
    : await getOrCreateServiceBotUser(GARBO_SERVICE_CLIENT_ID)

  let written = 0
  let skipped = 0
  let errors = 0

  for (const { company, lei } of work) {
    if (!lei) {
      skipped++
      continue
    }

    try {
      const isins = await getIsinsForLei(lei)
      const selected = selectUniqueIsinForAutoWrite(isins)

      if (!selected.isin) {
        console.info(
          `skip ${company.name} (${company.id}) lei=${lei}: ${selected.reason}`
        )
        skipped++
      } else if (dryRun) {
        console.info(
          `[dry-run] would write ${selected.isin} → ${company.name} (${company.id})`
        )
        written++
      } else if (user) {
        await companyIdentifierService.upsertIdentifier({
          companyId: company.id,
          type: 'ISIN',
          value: selected.isin,
          user,
          metadata: GLEIF_METADATA,
          verified: false,
          skipMetadataIfUnchanged: true,
        })
        console.info(
          `wrote ${selected.isin} → ${company.name} (${company.id})`
        )
        written++
      }
    } catch (error) {
      errors++
      console.error(
        `error ${company.name} (${company.id}) lei=${lei}:`,
        error instanceof Error ? error.message : error
      )
    }

    if (delayMs > 0) await sleep(delayMs)
  }

  console.info(
    `Done. written=${written}, skipped=${skipped}, errors=${errors}, dryRun=${dryRun}`
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
