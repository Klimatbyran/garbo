/**
 * Backfill ISIN / ORG_NUMBER / BIC from GLEIF for companies that already have an LEI.
 *
 * Write policy matches the pipeline (see doc/GLEIF_IDENTIFIERS_PLAN.md).
 *
 * Usage:
 *   npx tsx scripts/backfill-gleif-identifiers.ts --dry-run
 *   npx tsx scripts/backfill-gleif-identifiers.ts --limit=50
 *   npx tsx scripts/backfill-gleif-identifiers.ts --max-isins=100
 */

import 'dotenv/config'
import { parseArgs } from 'node:util'

import { prisma } from '../src/lib/prisma'
import { getGleifLinkedIdentifiers } from '../src/lib/gleif'
import {
  MAX_AUTO_ISINS,
  planGleifIdentifierWrites,
} from '../src/lib/gleifIdentifierWrite'
import { normalizeLei } from '../src/lib/normalizeLei'
import { companyIdentifierService } from '../src/api/services/companyIdentifierService'
import {
  GARBO_SERVICE_CLIENT_ID,
  getOrCreateServiceBotUser,
} from '../src/api/services/serviceBotUser'

const GLEIF_METADATA = {
  source: 'gleif-lei-record',
  comment: 'Backfill from LEI via GLEIF',
} as const

const { values } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    limit: { type: 'string' },
    delayMs: { type: 'string' },
    'max-isins': { type: 'string' },
  },
})

const dryRun = values['dry-run'] ?? false
const limit = values.limit ? Number(values.limit) : undefined
const delayMs = values.delayMs ? Number(values.delayMs) : 1200
const maxIsins = values['max-isins']
  ? Number(values['max-isins'])
  : MAX_AUTO_ISINS

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
        where: { type: { in: ['LEI', 'ISIN', 'ORG_NUMBER', 'BIC'] } },
        select: { type: true, value: true, role: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  const candidates = companies
    .map((company) => {
      const lei =
        normalizeLei(company.lei) ??
        normalizeLei(
          company.identifiers.find((row) => row.type === 'LEI')?.value
        )
      return { company, lei }
    })
    .filter((row) => row.lei)

  const work = Number.isFinite(limit)
    ? candidates.slice(0, limit as number)
    : candidates

  console.info(
    `Companies with LEI: ${candidates.length}; processing ${work.length} (dryRun=${dryRun}, maxIsins=${maxIsins})`
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
      const linked = await getGleifLinkedIdentifiers(lei, {
        maxIsinPages: Math.ceil(maxIsins / 50),
      })
      if (!linked) {
        console.info(`skip ${company.name}: no GLEIF record for ${lei}`)
        skipped++
        continue
      }

      const plan = planGleifIdentifierWrites({
        existing: company.identifiers,
        isins: linked.isins,
        isinTotal: linked.isinTotal,
        isinsTruncated: linked.isinsTruncated,
        registeredAs: linked.registeredAs,
        bics: linked.bics,
        maxIsins,
      })

      if (plan.items.length === 0) {
        console.info(`skip ${company.name}: ${plan.reasons.join(' | ')}`)
        skipped++
      } else if (dryRun) {
        console.info(
          `[dry-run] ${company.name}: would write ${plan.items.map((i) => `${i.type}=${i.value}`).join(', ')}`
        )
        written++
      } else if (user) {
        await companyIdentifierService.upsertMany({
          companyId: company.id,
          items: plan.items,
          user,
          metadata: GLEIF_METADATA,
          verified: false,
        })
        console.info(
          `wrote ${company.name}: ${plan.items.map((i) => `${i.type}=${i.value}`).join(', ')}`
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
