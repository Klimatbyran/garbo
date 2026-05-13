/**
 * Import emissions (and optional economy fields) from
 * `src/data/2026_03_22 - BigTech Emissions and Energy Compilation - Ketan Joshi.xlsx`
 * into Postgres via Prisma.
 *
 * Usage:
 *   npx tsx scripts/import-bigtech-ketan-joshi-xlsx.ts --dry-run
 *   npx tsx scripts/import-bigtech-ketan-joshi-xlsx.ts --apply
 *
 * Requires DATABASE_URL and a user row for metadata (IMPORT_USER_EMAIL or garbot user).
 *
 * Scope notes:
 * - Rows where Company_Name ≠ column “Company” are skipped (spreadsheet alignment issues).
 * - GHG category numbers are taken from the “Category N …” text; odd vendor numbering may
 *   not match ISO GHG labels — review critical rows if needed.
 */

import 'dotenv/config'
import ExcelJS from 'exceljs'
import { basename, resolve } from 'path'
import { prisma } from '../src/lib/prisma'
import { getReportingPeriodDates } from '../src/lib/reportingPeriodDates'
import { isMainModule } from './utils'

const DEFAULT_XLSX = resolve(
  'src/data/2026_03_22 - BigTech Emissions and Energy Compilation - Ketan Joshi.xlsx'
)

/** Fallback when no DB row matches by name (case-insensitive). */
const WIKIDATA_BY_CANONICAL_NAME: Readonly<Record<string, string>> = {
  amazon: 'Q3884',
  apple: 'Q312',
  google: 'Q20800404',
  meta: 'Q78683598',
  microsoft: 'Q2283',
  netflix: 'Q907311',
  nvidia: 'Q182898',
  salesforce: 'Q739746',
}

const IMPORT_COMMENT = 'Imported from Ketan Joshi BigTech emissions compilation (xlsx)'
const EMISSIONS_UNIT = 'tCO2e' as const

type RawRow = {
  reportVersion: string
  companyName: string
  year: number
  scopeCategory: string
  subCategory: string | null
  dataType: string
  metric: string
  value: number
  link: string | undefined
}

function parseArgs() {
  const dryRun = !process.argv.includes('--apply')
  const file =
    process.argv.find((a) => a.startsWith('--file='))?.slice('--file='.length) ??
    process.env.BIGTECH_XLSX ??
    DEFAULT_XLSX
  return { dryRun, file: resolve(file) }
}

function cellLinkOrText(v: unknown): string | undefined {
  if (v == null) return undefined
  if (typeof v === 'string') {
    const t = v.trim()
    return t.startsWith('http') ? t : undefined
  }
  if (typeof v === 'object' && 'hyperlink' in v) {
    const h = (v as { hyperlink?: string }).hyperlink
    return typeof h === 'string' ? h : undefined
  }
  return undefined
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) {
    return Number(v)
  }
  return null
}

async function readSheet(path: string): Promise<RawRow[]> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(path)
  const ws = wb.getWorksheet('Raw')
  if (!ws) {
    throw new Error(`Workbook missing "Raw" sheet: ${path}`)
  }

  const out: RawRow[] = []
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r).values
    if (!row || row.length < 8) continue

    const companyName = String(row[2] ?? '').trim()
    const altCompany = row[13] != null ? String(row[13]).trim() : ''
    if (!companyName) continue
    if (
      altCompany &&
      companyName.toLowerCase() !== altCompany.toLowerCase()
    ) {
      continue
    }

    const year = num(row[3])
    const value = num(row[8])
    if (year == null || value == null) continue

    out.push({
      reportVersion: String(row[1] ?? ''),
      companyName,
      year,
      scopeCategory: String(row[4] ?? '').trim(),
      subCategory:
        row[5] == null || String(row[5]).trim() === ''
          ? null
          : String(row[5]).trim(),
      dataType: String(row[6] ?? '').trim(),
      metric: String(row[7] ?? '').trim(),
      value,
      link: cellLinkOrText(row[16]),
    })
  }
  return out
}

function dataTypeRank(dt: string): number {
  if (dt === 'Raw') return 3
  if (dt === 'Market' || dt === 'Location') return 2
  if (dt === 'Claimed') return 1
  return 0
}

function pickBetter(a: RawRow, b: RawRow): RawRow {
  const va = a.reportVersion.trim()
  const vb = b.reportVersion.trim()
  if (va !== vb) return va > vb ? a : b
  const ra = dataTypeRank(a.dataType)
  const rb = dataTypeRank(b.dataType)
  if (ra !== rb) return ra > rb ? a : b
  return a.value >= b.value ? a : b
}

function parseScope3Category(sub: string | null): number | null {
  if (!sub) return null
  const m = sub.match(/Category\s*(\d+)/i)
  if (!m) return null
  const n = parseInt(m[1], 10)
  if (n >= 1 && n <= 16) return n
  return null
}

type Agg = {
  scope1?: RawRow
  scope2Mb?: RawRow
  scope2Lb?: RawRow
  scope1And2?: RawRow
  statedTotal?: RawRow
  statedScope3?: RawRow
  scope3Cats: Map<number, RawRow>
  turnover?: RawRow
  employees?: RawRow
  reportLink?: string
}

function aggregate(rows: RawRow[]): Map<string, Agg> {
  const byCY = new Map<string, RawRow[]>()
  for (const row of rows) {
    const key = `${row.companyName}\0${row.year}`
    const list = byCY.get(key)
    if (list) list.push(row)
    else byCY.set(key, [row])
  }

  const out = new Map<string, Agg>()
  for (const [key, list] of byCY) {
    const agg: Agg = { scope3Cats: new Map() }

    const consider = (
      row: RawRow,
      slot: keyof Omit<Agg, 'scope3Cats'>,
      pred: (r: RawRow) => boolean
    ) => {
      if (!pred(row)) return
      const cur = agg[slot] as RawRow | undefined
      agg[slot] = cur ? pickBetter(cur, row) : row
      if (row.link) agg.reportLink = row.link
    }

    for (const row of list) {
      const { scopeCategory: sc, subCategory: sub, dataType: dt } = row

      if (sc === 'Scope1' && dt === 'Raw') {
        consider(row, 'scope1', () => row.metric.toLowerCase().includes('tco2'))
      }
      if (sc === 'Scope2' && dt === 'Market') {
        consider(row, 'scope2Mb', () => row.metric.toLowerCase().includes('tco2'))
      }
      if (sc === 'Scope2' && dt === 'Location') {
        consider(row, 'scope2Lb', () => row.metric.toLowerCase().includes('tco2'))
      }
      if (
        (sc === 'Total (Direct)' || sc === 'Total (direct)') &&
        (dt === 'Raw' || dt === 'Claimed')
      ) {
        consider(row, 'scope1And2', () =>
          row.metric.toLowerCase().includes('tco2')
        )
      }
      if (
        (sc === 'Total (All)' ||
          sc === 'Total (all)' ||
          sc === 'Total ( all )') &&
        (dt === 'Raw' || dt === 'Claimed')
      ) {
        consider(row, 'statedTotal', () =>
          row.metric.toLowerCase().includes('tco2')
        )
      }
      if (
        (sc === 'Total (Scope3)' ||
          sc === 'Total (Scope 3)' ||
          sc === 'Total (scope 3)') &&
        (dt === 'Raw' || dt === 'Claimed' || dt === 'Location')
      ) {
        consider(row, 'statedScope3', () =>
          row.metric.toLowerCase().includes('tco2')
        )
      }
      if (sc === 'Scope3') {
        const cat = parseScope3Category(sub)
        if (cat != null && (dt === 'Raw' || dt === 'Market')) {
          const prev = agg.scope3Cats.get(cat)
          agg.scope3Cats.set(cat, prev ? pickBetter(prev, row) : row)
          if (row.link) agg.reportLink = row.link
        }
      }
      if (sc === 'Revenue') {
        consider(row, 'turnover', () =>
          /\$m\s*usd|millions\s*usd/i.test(`${row.metric} ${row.dataType}`)
        )
      }
      if (sc === 'Employees' && row.metric.toLowerCase() === 'number') {
        consider(row, 'employees', () => true)
      }
    }

    const hasEmissions =
      agg.scope1 ||
      agg.scope2Mb ||
      agg.scope2Lb ||
      agg.scope1And2 ||
      agg.statedTotal ||
      agg.statedScope3 ||
      agg.scope3Cats.size > 0
    const hasEco = agg.turnover || agg.employees

    if (hasEmissions || hasEco) out.set(key, agg)
  }

  return out
}

async function resolveCompanyWikidataId(companyName: string): Promise<string | null> {
  const fromDb = await prisma.company.findFirst({
    where: { name: { equals: companyName, mode: 'insensitive' } },
    select: { wikidataId: true },
  })
  if (fromDb) return fromDb.wikidataId

  const mapped =
    WIKIDATA_BY_CANONICAL_NAME[companyName.trim().toLowerCase()] ?? null
  return mapped
}

async function getImportUserId(): Promise<string> {
  const email = process.env.IMPORT_USER_EMAIL
  const byEmail = email
    ? await prisma.user.findFirst({ where: { email } })
    : null
  if (byEmail) return byEmail.id

  const garbo = await prisma.user.findFirst({
    where: { email: 'hej@klimatkollen.se' },
  })
  if (garbo) return garbo.id

  const bot = await prisma.user.findFirst({ where: { bot: true } })
  if (bot) return bot.id

  throw new Error(
    'No user for metadata: set IMPORT_USER_EMAIL or add user hej@klimatkollen.se / a bot user'
  )
}

function turnoverUsdValue(row: RawRow): number {
  const hint = `${row.metric} ${row.dataType}`.toLowerCase()
  const millions = hint.includes('million') || hint.includes('$m')
  return millions ? row.value * 1_000_000 : row.value
}

async function pushAgg(params: {
  wikidataId: string
  companyName: string
  year: number
  agg: Agg
  userId: string
  sourceTag: string
  dryRun: boolean
}) {
  const { wikidataId, companyName, year, agg, userId, sourceTag, dryRun } =
    params

  const [startIso, endIso] = getReportingPeriodDates(year, 1, 12)
  const startDate = new Date(`${startIso}T00:00:00.000Z`)
  const endDate = new Date(`${endIso}T00:00:00.000Z`)
  const yearStr = String(year)

  const mdPayload = {
    userId,
    comment: `${IMPORT_COMMENT} — ${companyName} ${year}`,
    source: sourceTag,
  }

  if (dryRun) {
    console.log(
      `[dry-run] ${companyName} (${wikidataId}) ${year}: scope1=${!!agg.scope1} s2mb=${!!agg.scope2Mb} s2lb=${!!agg.scope2Lb} s12=${!!agg.scope1And2} cats=${agg.scope3Cats.size} st=${!!agg.statedTotal} s3t=${!!agg.statedScope3} rev=${!!agg.turnover} emp=${!!agg.employees}`
    )
    return
  }

  const mdRp = await prisma.metadata.create({ data: mdPayload })
  const mkMd = () => prisma.metadata.create({ data: mdPayload })

  const reportingPeriod = await prisma.reportingPeriod.upsert({
    where: {
      companyId_year: { companyId: wikidataId, year: yearStr },
    },
    create: {
      companyId: wikidataId,
      year: yearStr,
      startDate,
      endDate,
      reportURL: agg.reportLink ?? undefined,
      metadata: { connect: { id: mdRp.id } },
    },
    update: {
      startDate,
      endDate,
      ...(agg.reportLink ? { reportURL: agg.reportLink } : {}),
      metadata: { connect: { id: mdRp.id } },
    },
  })

  const emissions = await prisma.emissions.upsert({
    where: { reportingPeriodId: reportingPeriod.id },
    create: { reportingPeriodId: reportingPeriod.id },
    update: {},
  })

  if (agg.scope1) {
    const mdS1 = await mkMd()
    await prisma.scope1.upsert({
      where: { emissionsId: emissions.id },
      create: {
        emissionsId: emissions.id,
        total: agg.scope1.value,
        unit: EMISSIONS_UNIT,
        metadata: { connect: { id: mdS1.id } },
      },
      update: {
        total: agg.scope1.value,
        metadata: { connect: { id: mdS1.id } },
      },
    })
  }

  if (agg.scope2Mb || agg.scope2Lb) {
    const mdS2 = await mkMd()
    await prisma.scope2.upsert({
      where: { emissionsId: emissions.id },
      create: {
        emissionsId: emissions.id,
        mb: agg.scope2Mb?.value ?? null,
        lb: agg.scope2Lb?.value ?? null,
        unknown: null,
        unit: EMISSIONS_UNIT,
        metadata: { connect: { id: mdS2.id } },
      },
      update: {
        mb: agg.scope2Mb?.value ?? null,
        lb: agg.scope2Lb?.value ?? null,
        metadata: { connect: { id: mdS2.id } },
      },
    })
  }

  if (agg.scope1And2) {
    const mdS12 = await mkMd()
    await prisma.scope1And2.upsert({
      where: { emissionsId: emissions.id },
      create: {
        emissionsId: emissions.id,
        total: agg.scope1And2.value,
        unit: EMISSIONS_UNIT,
        metadata: { connect: { id: mdS12.id } },
      },
      update: {
        total: agg.scope1And2.value,
        metadata: { connect: { id: mdS12.id } },
      },
    })
  }

  if (agg.statedTotal) {
    const mdSt = await mkMd()
    await prisma.statedTotalEmissions.upsert({
      where: { emissionsId: emissions.id },
      create: {
        emissionsId: emissions.id,
        total: agg.statedTotal.value,
        unit: EMISSIONS_UNIT,
        metadata: { connect: { id: mdSt.id } },
      },
      update: {
        total: agg.statedTotal.value,
        metadata: { connect: { id: mdSt.id } },
      },
    })
  }

  const needsScope3 = agg.statedScope3 || agg.scope3Cats.size > 0
  if (needsScope3) {
    const mdScope3Root = await mkMd()
    const scope3 = await prisma.scope3.upsert({
      where: { emissionsId: emissions.id },
      create: {
        emissionsId: emissions.id,
        metadata: { connect: { id: mdScope3Root.id } },
      },
      update: {},
    })

    if (agg.statedScope3) {
      const mdS3Tot = await mkMd()
      await prisma.statedTotalEmissions.upsert({
        where: { scope3Id: scope3.id },
        create: {
          scope3Id: scope3.id,
          total: agg.statedScope3.value,
          unit: EMISSIONS_UNIT,
          metadata: { connect: { id: mdS3Tot.id } },
        },
        update: {
          total: agg.statedScope3.value,
          metadata: { connect: { id: mdS3Tot.id } },
        },
      })
    }

    await prisma.scope3Category.deleteMany({ where: { scope3Id: scope3.id } })
    for (const [category, row] of agg.scope3Cats) {
      const mdCat = await mkMd()
      await prisma.scope3Category.create({
        data: {
          scope3Id: scope3.id,
          category,
          total: row.value,
          unit: EMISSIONS_UNIT,
          metadata: { connect: { id: mdCat.id } },
        },
      })
    }
  }

  if (agg.turnover || agg.employees) {
    const economy = await prisma.economy.upsert({
      where: { reportingPeriodId: reportingPeriod.id },
      create: { reportingPeriodId: reportingPeriod.id },
      update: {},
    })

    if (agg.turnover) {
      const mdT = await prisma.metadata.create({ data: mdPayload })
      await prisma.turnover.upsert({
        where: { economyId: economy.id },
        create: {
          economyId: economy.id,
          value: turnoverUsdValue(agg.turnover),
          currency: 'USD',
          metadata: { connect: { id: mdT.id } },
        },
        update: {
          value: turnoverUsdValue(agg.turnover),
          currency: 'USD',
          metadata: { connect: { id: mdT.id } },
        },
      })
    }

    if (agg.employees) {
      const mdE = await prisma.metadata.create({ data: mdPayload })
      await prisma.employees.upsert({
        where: { economyId: economy.id },
        create: {
          economyId: economy.id,
          value: agg.employees.value,
          unit: 'headcount',
          metadata: { connect: { id: mdE.id } },
        },
        update: {
          value: agg.employees.value,
          metadata: { connect: { id: mdE.id } },
        },
      })
    }
  }

  console.log(`Imported ${companyName} (${wikidataId}) — ${year}`)
}

async function main() {
  const { dryRun, file } = parseArgs()
  const rows = await readSheet(file)
  const aggregated = aggregate(rows)
  const userId = dryRun ? '' : await getImportUserId()
  const sourceTag = `${basename(file)} (BigTech compilation)`

  console.log(
    dryRun
      ? `Dry run (${aggregated.size} company-years). Pass --apply to write.`
      : `Applying ${aggregated.size} company-years…`
  )

  const missingCompanies: string[] = []

  for (const [key, agg] of aggregated) {
    const [companyName, yearStr] = key.split('\0')
    const year = Number(yearStr)
    const wikidataId = await resolveCompanyWikidataId(companyName)
    if (!wikidataId) {
      missingCompanies.push(companyName)
      console.warn(`Skipping unknown company (no DB row / map): ${companyName}`)
      continue
    }

    if (!dryRun) {
      const exists = await prisma.company.findUnique({
        where: { wikidataId },
        select: { wikidataId: true },
      })
      if (!exists) {
        missingCompanies.push(`${companyName} (${wikidataId})`)
        console.warn(
          `Skipping — no Company row for Wikidata id ${wikidataId} (${companyName}); create the company first or fix WIKIDATA_BY_CANONICAL_NAME`
        )
        continue
      }
    }

    await pushAgg({
      wikidataId,
      companyName,
      year,
      agg,
      userId,
      sourceTag,
      dryRun,
    })
  }

  if (missingCompanies.length && !dryRun) {
    console.warn('Unresolved / missing:', [...new Set(missingCompanies)])
  }
}

if (isMainModule(import.meta.url)) {
  main()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(() => prisma.$disconnect())
}
