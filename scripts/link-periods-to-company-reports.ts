/**
 * Data migration: populate ReportingPeriod.companyReportId for all existing rows.
 *
 * Run AFTER:
 *   1. The PR 1 schema migration (adds CompanyReport table + nullable companyReportId column)
 *   2. scripts/backfill-report-from-periods.ts (0b) — ensures Report rows exist for periods
 *      that have identity fields; this script calls upsertReportInRegistry as a fallback
 *      so it is safe to run even if 0b has not been run yet.
 *
 * For each ReportingPeriod:
 *   - If the period has at least one identity field (reportSha256, reportS3Url, reportURL):
 *       find (or create) the matching Report via upsertReportInRegistry, then find (or
 *       create) a CompanyReport for (companyId, report.id), and set companyReportId.
 *   - If the period has no identity fields:
 *       find (or create) a synthetic CompanyReport for (companyId, registryReportId=NULL)
 *       and set companyReportId.
 *
 * CompanyReport.reportYear is set to the max period year across all periods that share
 * the same document (same registryReportId).
 *
 * Usage:
 *   npx tsx scripts/link-periods-to-company-reports.ts --dry-run
 *   npx tsx scripts/link-periods-to-company-reports.ts
 *
 * Safe to re-run: already-linked periods (companyReportId IS NOT NULL) are skipped.
 */

import 'dotenv/config'
import { parseArgs } from 'node:util'

import { prisma } from '../src/lib/prisma'
import { registryService } from '../src/api/services/registryService'
import {
  isLikelyStoredObjectUrl,
  trimStr,
} from '../src/api/services/registryReportIdentity'
import { disconnectRedisCache } from '../src/createCache'

// ── Helpers ───────────────────────────────────────────────────────────────────

function bestWebUrl(reportURL: string | null): string | null {
  const u = trimStr(reportURL)
  return u && !isLikelyStoredObjectUrl(u) ? u : null
}

function bestS3Url(
  reportS3Url: string | null,
  reportURL: string | null
): string | null {
  const s3 = trimStr(reportS3Url)
  if (s3) return s3
  const u = trimStr(reportURL)
  return u && isLikelyStoredObjectUrl(u) ? u : null
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const { values } = parseArgs({
    options: {
      'dry-run': { type: 'boolean', default: false },
    },
  })
  const dryRun = Boolean(values['dry-run'])

  try {
    // Load all periods that still need linking, including company name for upsert.
    const periods = await prisma.reportingPeriod.findMany({
      where: { companyReportId: null },
      select: {
        id: true,
        year: true,
        companyId: true,
        reportURL: true,
        reportS3Url: true,
        reportSha256: true,
        company: { select: { name: true } },
      },
      orderBy: { id: 'asc' },
    })

    const total = await prisma.reportingPeriod.count()
    const alreadyLinked = total - periods.length
    console.log(
      `${total} total periods; ${alreadyLinked} already linked; ${periods.length} to process.`
    )

    if (periods.length === 0) {
      console.log('Nothing to do.')
      return
    }

    // Cache CompanyReport lookups to avoid redundant DB hits within this run.
    // Key: `${companyId}::${registryReportId ?? 'synthetic'}`
    const companyReportCache = new Map<string, string>()

    let linked = 0
    let errors = 0

    for (const period of periods) {
      const hasIdentity =
        trimStr(period.reportSha256) ||
        trimStr(period.reportS3Url) ||
        trimStr(period.reportURL)

      try {
        let registryReportId: string | null = null

        if (hasIdentity) {
          const webUrl = bestWebUrl(period.reportURL)
          const s3Url = bestS3Url(period.reportS3Url, period.reportURL)
          const url = webUrl ?? s3Url

          if (url) {
            if (dryRun) {
              console.log(
                `[dry-run] Would upsert Report + CompanyReport for period ${period.id} (company=${period.companyId} year=${period.year} url=${url.slice(0, 80)})`
              )
              linked++
              continue
            }

            const report = await registryService.upsertReportInRegistry({
              companyName: period.company.name,
              wikidataId: period.companyId,
              url,
              sourceUrl: webUrl ?? null,
              s3Url: s3Url ?? null,
              sha256: trimStr(period.reportSha256) ?? null,
            })
            registryReportId = report.id
          }
        }

        if (dryRun) {
          console.log(
            `[dry-run] Would link period ${period.id} (company=${period.companyId} year=${period.year}) to ${registryReportId ? `Report ${registryReportId}` : 'synthetic CompanyReport'}`
          )
          linked++
          continue
        }

        // Find or create the CompanyReport for this (company, report) pair.
        const cacheKey = `${period.companyId}::${registryReportId ?? 'synthetic'}`
        let companyReportId = companyReportCache.get(cacheKey)

        if (!companyReportId) {
          const existing = await prisma.companyReport.findFirst({
            where: {
              companyId: period.companyId,
              registryReportId: registryReportId ?? null,
            },
            select: { id: true },
          })

          if (existing) {
            companyReportId = existing.id
          } else {
            const created = await prisma.companyReport.create({
              data: {
                companyId: period.companyId,
                registryReportId: registryReportId ?? null,
                // reportYear is set in a second pass below once all periods are linked.
              },
            })
            companyReportId = created.id
          }

          companyReportCache.set(cacheKey, companyReportId)
        }

        await prisma.reportingPeriod.update({
          where: { id: period.id },
          data: { companyReportId },
        })

        linked++
      } catch (err) {
        errors++
        console.error(
          `  [error] period ${period.id} (company=${period.companyId} year=${period.year}):`,
          err
        )
      }
    }

    console.log(
      dryRun
        ? `[dry-run] Would link ${linked} period(s).`
        : `Linked ${linked} period(s)${errors > 0 ? `; ${errors} error(s) — check output above` : '.'}`
    )

    // Second pass: set reportYear on each CompanyReport to the max year of its periods.
    if (!dryRun && linked > 0) {
      console.log('Setting reportYear on CompanyReport rows from max period year…')

      const companyReports = await prisma.companyReport.findMany({
        where: { reportYear: null },
        select: {
          id: true,
          reportingPeriods: { select: { year: true } },
        },
      })

      let yearUpdates = 0
      for (const cr of companyReports) {
        const maxYear = cr.reportingPeriods
          .map((p) => p.year)
          .filter(Boolean)
          .sort()
          .at(-1)

        if (maxYear) {
          await prisma.companyReport.update({
            where: { id: cr.id },
            data: { reportYear: maxYear },
          })
          yearUpdates++
        }
      }

      console.log(`Updated reportYear on ${yearUpdates} CompanyReport row(s).`)
    }
  } finally {
    await disconnectRedisCache()
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
