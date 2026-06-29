/**
 * Backfill `company_identifiers` from legacy `Company.wikidataId` and `Company.lei`.
 *
 * Usage:
 *   npx tsx scripts/backfill-company-identifiers.ts --dry-run
 *   npx tsx scripts/backfill-company-identifiers.ts
 *   npx tsx scripts/backfill-company-identifiers.ts --mark-verified
 *
 * Run against staging first.
 */

import 'dotenv/config'
import { parseArgs } from 'node:util'

import { prisma } from '../src/lib/prisma'
import { companyIdentifierService } from '../src/api/services/companyIdentifierService'

const { values } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    'mark-verified': { type: 'boolean', default: false },
  },
})

const dryRun = values['dry-run'] ?? false
const markVerified = values['mark-verified'] ?? false

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
      source: 'migration-backfill',
      verified: markVerified,
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
