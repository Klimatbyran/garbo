/**
 * Data migration: set ReportingPeriod.companyReportId (PR 1).
 *
 * Run after: PR 1 migration; 0b backfill recommended.
 *
 * One CompanyReport per company → latest Report (newest period Metadata.source URL,
 * else highest Report.reportYear in registry, else synthetic). Does not split by
 * per-period reportURL. PR 1b may add a second shell after PR 2.
 *
 *   npx tsx scripts/link-periods-to-company-reports.ts --dry-run
 *   npx tsx scripts/link-periods-to-company-reports.ts
 *
 * Skips rows that already have companyReportId.
 */

import 'dotenv/config'
import { parseArgs } from 'node:util'

import { prisma } from '../src/lib/prisma'
import { registryService } from '../src/api/services/registryService'
import {
  isStorageUrl,
  parseReportYearFromUrl,
  pickRowToKeep,
  trimStr,
  type RegistryReportIdentityRow,
} from '../src/api/services/registryReportIdentity'
import { disconnectRedisCache } from '../src/createCache'

type PeriodRow = {
  id: string
  year: string
  companyId: string
  reportURL: string | null
  reportS3Url: string | null
  reportSha256: string | null
  company: { name: string }
}

type LatestResolution = {
  kind: 'metadata' | 'registry' | 'synthetic' | 'metadata-dry-run'
  documentYear: number | null
  registryReportId: string | null
  sourcePreview?: string
  registryReportYear?: string | null
}

type YearMismatchRow = {
  companyId: string
  companyName: string
  periodCount: number
  maxPeriodYear: number
  documentYear: number
  via: string
}

function isHttpSource(source: string | null | undefined): boolean {
  const s = trimStr(source)
  return !!s && /^https?:\/\//i.test(s)
}

function bestWebUrl(reportURL: string | null): string | null {
  const u = trimStr(reportURL)
  return u && !isStorageUrl(u) ? u : null
}

function bestS3Url(
  reportS3Url: string | null,
  reportURL: string | null
): string | null {
  const s3 = trimStr(reportS3Url)
  if (s3) return s3
  const u = trimStr(reportURL)
  return u && isStorageUrl(u) ? u : null
}

function parseReportYear(reportYear: string | null | undefined): number | null {
  const y = trimStr(reportYear ?? null)
  if (!y || !/^\d{4}$/.test(y)) return null
  return Number(y)
}

function maxCalendarYearAmongPeriods(periods: PeriodRow[]): number | null {
  let max: number | null = null
  for (const period of periods) {
    const year = parseReportYear(period.year)
    if (year === null) continue
    if (max === null || year > max) max = year
  }
  return max
}

function documentYearFromMetadataUrl(source: string): number | null {
  return parseReportYear(parseReportYearFromUrl(source))
}

function groupPeriodsByCompany(periods: PeriodRow[]): Map<string, PeriodRow[]> {
  const byCompany = new Map<string, PeriodRow[]>()
  for (const period of periods) {
    const list = byCompany.get(period.companyId) ?? []
    list.push(period)
    byCompany.set(period.companyId, list)
  }
  return byCompany
}

async function latestMetadataSourceForPeriods(
  periodIds: string[]
): Promise<string | null> {
  if (periodIds.length === 0) return null

  const rows = await prisma.metadata.findMany({
    where: {
      reportingPeriodId: { in: periodIds },
      source: { not: null },
    },
    orderBy: { updatedAt: 'desc' },
    select: { source: true },
    take: 200,
  })

  for (const row of rows) {
    if (isHttpSource(row.source)) return trimStr(row.source)
  }
  return null
}

async function registryReportWithHighestYear(
  companyId: string
): Promise<{ id: string; reportYear: string | null } | null> {
  const reports = await prisma.report.findMany({
    where: { wikidataId: companyId },
    select: {
      id: true,
      url: true,
      companyName: true,
      wikidataId: true,
      reportYear: true,
      sourceUrl: true,
      s3Url: true,
      sha256: true,
    },
  })

  if (reports.length === 0) return null

  const maxYear = Math.max(
    ...reports.map((r) => parseReportYear(r.reportYear) ?? -1)
  )
  if (maxYear < 0) {
    const fallback = pickRowToKeep(reports as RegistryReportIdentityRow[])
    return { id: fallback.id, reportYear: fallback.reportYear }
  }

  const tiedAtMaxYear = reports.filter(
    (r) => (parseReportYear(r.reportYear) ?? -1) === maxYear
  )
  const chosen = pickRowToKeep(tiedAtMaxYear as RegistryReportIdentityRow[])
  return { id: chosen.id, reportYear: chosen.reportYear }
}

async function resolveLatestReportForCompany(
  companyId: string,
  companyName: string,
  companyPeriods: PeriodRow[],
  dryRun: boolean
): Promise<LatestResolution> {
  const periodIds = companyPeriods.map((p) => p.id)
  const metadataSource = await latestMetadataSourceForPeriods(periodIds)

  if (metadataSource) {
    const documentYear = documentYearFromMetadataUrl(metadataSource)
    if (dryRun) {
      return {
        kind: 'metadata-dry-run',
        documentYear,
        registryReportId: null,
        sourcePreview: metadataSource.slice(0, 100),
      }
    }

    const webUrl = bestWebUrl(metadataSource)
    const s3Url = bestS3Url(null, metadataSource)
    const url = webUrl ?? s3Url ?? metadataSource

    const report = await registryService.upsertReportInRegistry({
      companyName,
      wikidataId: companyId,
      url,
      sourceUrl: webUrl ?? null,
      s3Url: s3Url ?? null,
      sha256: null,
    })

    return {
      kind: 'metadata',
      documentYear,
      registryReportId: report.id,
      sourcePreview: metadataSource.slice(0, 80),
    }
  }

  const registryRow = await registryReportWithHighestYear(companyId)
  if (registryRow) {
    return {
      kind: 'registry',
      documentYear: parseReportYear(registryRow.reportYear),
      registryReportId: registryRow.id,
      registryReportYear: registryRow.reportYear,
    }
  }

  return { kind: 'synthetic', documentYear: null, registryReportId: null }
}

async function findOrCreateCompanyReport(
  companyId: string,
  registryReportId: string | null,
  cache: Map<string, string>
): Promise<string> {
  const cacheKey = `${companyId}::${registryReportId ?? 'synthetic'}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const existing = await prisma.companyReport.findFirst({
    where: {
      companyId,
      registryReportId: registryReportId ?? null,
    },
    select: { id: true },
  })

  const companyReportId =
    existing?.id ??
    (
      await prisma.companyReport.create({
        data: {
          companyId,
          registryReportId: registryReportId ?? null,
        },
      })
    ).id

  cache.set(cacheKey, companyReportId)
  return companyReportId
}

function resolutionLabel(resolution: LatestResolution): string {
  if (resolution.kind === 'metadata-dry-run') {
    return `metadata docYear=${resolution.documentYear ?? '?'} ${resolution.sourcePreview ?? ''}`
  }
  if (resolution.kind === 'metadata') {
    return `metadata docYear=${resolution.documentYear ?? '?'}`
  }
  if (resolution.kind === 'registry') {
    return `registry reportYear=${resolution.registryReportYear ?? '—'}`
  }
  return 'synthetic'
}

async function main() {
  const { values } = parseArgs({
    options: {
      'dry-run': { type: 'boolean', default: false },
    },
  })
  const dryRun = Boolean(values['dry-run'])

  const resolutionCounts = {
    metadata: 0,
    registry: 0,
    synthetic: 0,
  }
  const yearMismatches: YearMismatchRow[] = []

  try {
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

    const byCompany = groupPeriodsByCompany(periods)
    console.log(
      `Linking ${periods.length} period(s) across ${byCompany.size} companies (one shell per company).`
    )

    const companyReportCache = new Map<string, string>()
    let linked = 0
    let errors = 0

    for (const [companyId, companyPeriods] of byCompany) {
      const companyName = companyPeriods[0]?.company.name ?? companyId
      const maxPeriodYear = maxCalendarYearAmongPeriods(companyPeriods)

      try {
        const resolution = await resolveLatestReportForCompany(
          companyId,
          companyName,
          companyPeriods,
          dryRun
        )

        if (resolution.kind === 'metadata-dry-run') {
          resolutionCounts.metadata++
        } else {
          resolutionCounts[resolution.kind]++
        }

        if (
          maxPeriodYear !== null &&
          resolution.documentYear !== null &&
          resolution.documentYear !== maxPeriodYear
        ) {
          yearMismatches.push({
            companyId,
            companyName,
            periodCount: companyPeriods.length,
            maxPeriodYear,
            documentYear: resolution.documentYear,
            via: resolution.kind,
          })
        }

        if (dryRun) {
          console.log(
            `[dry-run] ${companyId} (${companyName}): ${companyPeriods.length} period(s), maxPeriodYear=${maxPeriodYear ?? '—'} → ${resolutionLabel(resolution)}`
          )
          linked += companyPeriods.length
          continue
        }

        const companyReportId = await findOrCreateCompanyReport(
          companyId,
          resolution.registryReportId,
          companyReportCache
        )

        await prisma.reportingPeriod.updateMany({
          where: {
            id: { in: companyPeriods.map((p) => p.id) },
          },
          data: { companyReportId },
        })

        linked += companyPeriods.length
      } catch (err) {
        errors++
        console.error(`  [error] company ${companyId}:`, err)
      }
    }

    console.log(
      dryRun
        ? `[dry-run] Would link ${linked} period(s) on ${byCompany.size} companies.`
        : `Linked ${linked} period(s) on ${byCompany.size} companies${errors > 0 ? `; ${errors} company error(s)` : ''}.`
    )
    console.log(
      `Resolution: metadata=${resolutionCounts.metadata} registry=${resolutionCounts.registry} synthetic=${resolutionCounts.synthetic}`
    )
    console.log(
      '(Low synthetic count is good. High count → no period metadata URL and no Report for wikidataId.)'
    )

    if (yearMismatches.length > 0) {
      console.log(
        `\nYear mismatch: chosen document year ≠ max calendar year on periods (${yearMismatches.length} companies). Often comparison years + latest PDF metadata — spot-check for accuracy / 1b:`
      )
      for (const row of yearMismatches) {
        console.log(
          `  ${row.companyId} | ${row.companyName} | periods=${row.periodCount} | maxPeriodYear=${row.maxPeriodYear} | documentYear=${row.documentYear} | via=${row.via}`
        )
      }
    } else {
      console.log(
        '\nYear mismatch: none (document year matches max period year for every company, or year unknown).'
      )
    }

    if (!dryRun && linked > 0) {
      console.log(
        '\nSetting CompanyReport.reportYear to max linked period calendar year per shell…'
      )

      const companyReports = await prisma.companyReport.findMany({
        where: { reportYear: null },
        select: {
          id: true,
          reportingPeriods: { select: { year: true } },
        },
      })

      let yearUpdates = 0
      for (const companyReport of companyReports) {
        const maxYear = companyReport.reportingPeriods
          .map((p) => p.year)
          .filter(Boolean)
          .sort()
          .at(-1)

        if (maxYear) {
          await prisma.companyReport.update({
            where: { id: companyReport.id },
            data: { reportYear: maxYear },
          })
          yearUpdates++
        }
      }

      console.log(`Updated CompanyReport.reportYear on ${yearUpdates} row(s).`)
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
