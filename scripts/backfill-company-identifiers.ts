/**
 * Backfill `company_identifiers` from legacy `Company.wikidataId` and `Company.lei`.
 *
 * Metadata uses legacy-specific `source` and `comment`; does not set `verifiedBy`.
 *
 * Usage:
 *   npx tsx scripts/backfill-company-identifiers.ts --dry-run
 *   npx tsx scripts/backfill-company-identifiers.ts
 *
 * Run against staging first.
 */

import 'dotenv/config'
import { parseArgs } from 'node:util'

import { prisma } from '../src/lib/prisma'
import { companyIdentifierService } from '../src/api/services/companyIdentifierService'

const LEGACY_WIKIDATA_METADATA = {
  source: 'legacy-company-wikidata',
  comment:
    'Inherited from Company.wikidataId before company_identifiers table (Phase 1 backfill). Pre-identifier company identity.',
} as const

const LEGACY_LEI_METADATA = {
  source: 'legacy-company-lei',
  comment:
    'Inherited from Company.lei before company_identifiers table (Phase 1 backfill).',
} as const

const { values } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
  },
})

const dryRun = values['dry-run'] ?? false

async function main() {
  const companies = await prisma.company.findMany({
    select: { id: true, wikidataId: true, lei: true, name: true },
    orderBy: { name: 'asc' },
  })

  console.info(`Found ${companies.length} companies`)

  let synced = 0
  let skipped = 0

  for (const company of companies) {
    const hasWikidata = Boolean(company.wikidataId?.trim())
    const hasLei = Boolean(company.lei?.trim())

    if (!hasWikidata && !hasLei) {
      skipped++
      continue
    }

    if (dryRun) {
      console.info(
        `[dry-run] ${company.name} (${company.id}): wikidata=${hasWikidata}, lei=${hasLei}`
      )
      synced++
      continue
    }

    await companyIdentifierService.syncFromLegacyColumns(company, {
      wikidataMetadata: LEGACY_WIKIDATA_METADATA,
      leiMetadata: LEGACY_LEI_METADATA,
    })
    synced++
  }

  console.info(`Done. synced=${synced}, skipped=${skipped}, dryRun=${dryRun}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
