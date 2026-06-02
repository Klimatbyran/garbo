/**
 * One-off backfill: populate nullable `Company.id` for existing rows.
 *
 * Usage:
 *   npx tsx scripts/backfill-company-id.ts --dry-run
 *   npx tsx scripts/backfill-company-id.ts
 *
 * Safe to re-run: only rows with `id IS NULL` are updated.
 * IDs use CUID v1 (same format as Prisma `@default(cuid())`), via scripts/lib/create-prisma-cuid.ts.
 */

import 'dotenv/config'
import { parseArgs } from 'node:util'
import { Prisma } from '@prisma/client'

import { prisma } from '../src/lib/prisma'
import { createPrismaCuid } from './lib/create-prisma-cuid'

type CliOptions = {
  dryRun: boolean
}

function toNumber(v: bigint): number {
  return Number(v)
}

async function countNullIds(): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "Company"
    WHERE "id" IS NULL
  `
  return toNumber(rows[0]?.count ?? 0n)
}

async function countDuplicateIds(): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM (
      SELECT "id"
      FROM "Company"
      WHERE "id" IS NOT NULL
      GROUP BY "id"
      HAVING COUNT(*) > 1
    ) duplicates
  `
  return toNumber(rows[0]?.count ?? 0n)
}

async function updateCompanyIdWithRetry(wikidataId: string): Promise<boolean> {
  const maxAttempts = 5
  let attempt = 0

  while (attempt < maxAttempts) {
    attempt += 1
    try {
      const result = await prisma.company.updateMany({
        where: { wikidataId, id: null },
        data: { id: createPrismaCuid() },
      })
      return result.count > 0
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        continue
      }
      throw error
    }
  }

  throw new Error(
    `Failed to generate unique Company.id for wikidataId=${wikidataId} after ${maxAttempts} attempts`
  )
}

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'dry-run': { type: 'boolean' },
    },
    strict: true,
    allowPositionals: false,
  })

  const opts: CliOptions = {
    dryRun: Boolean(values['dry-run']),
  }

  const toBackfill = await prisma.company.findMany({
    where: { id: null },
    select: { wikidataId: true, name: true },
    orderBy: { wikidataId: 'asc' },
  })

  console.log(`[backfill:company-id] rows with null id: ${toBackfill.length}`)

  if (opts.dryRun) {
    const preview = toBackfill.slice(0, 10)
    if (preview.length) {
      console.log('[backfill:company-id] dry-run preview (first 10):')
      for (const company of preview) {
        console.log(`  - ${company.wikidataId} (${company.name})`)
      }
    }
    console.log('[backfill:company-id] dry-run complete (no writes).')
    return
  }

  let updated = 0
  for (const company of toBackfill) {
    const didUpdate = await updateCompanyIdWithRetry(company.wikidataId)
    if (didUpdate) updated += 1
  }

  const nullCount = await countNullIds()
  const duplicateCount = await countDuplicateIds()

  console.log(`[backfill:company-id] updated rows: ${updated}`)
  console.log(`[backfill:company-id] null ids remaining: ${nullCount}`)
  console.log(`[backfill:company-id] duplicate ids: ${duplicateCount}`)

  if (nullCount > 0 || duplicateCount > 0) {
    throw new Error(
      'Backfill validation failed: expected 0 null ids and 0 duplicate ids.'
    )
  }

  console.log('[backfill:company-id] done.')
}

main()
  .catch((error) => {
    console.error('[backfill:company-id] failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
