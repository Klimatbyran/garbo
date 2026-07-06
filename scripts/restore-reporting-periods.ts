/**
 * Restore complete reporting period trees from a recovered DB into prod.
 *
 * For each company where backup max year = 2024 and prod max year >= 2025,
 * creates a new Report → CompanyReport in prod (anchored to the backup PDF URL)
 * and copies ALL reporting periods from the backup under it, with the full
 * emissions + economy tree and metadata (preserving validation status).
 * Does not touch the existing 2025 CompanyReport or its periods.
 *
 * Defaults to dry-run. Pass --commit to write.
 *
 * Usage (local):
 *   SOURCE_DATABASE_URL=postgresql://postgres@localhost:5433/recovered \
 *   DATABASE_URL=postgresql://postgres:<your-local-password>@localhost:5432/garbo \
 *   npx tsx scripts/restore-reporting-periods.ts
 *
 *   # Commit:
 *   ... --commit
 *
 * Usage (cluster): see k8s/jobs/README.md
 */

import { PrismaClient } from '@prisma/client'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    commit: { type: 'boolean', default: false },
    company: { type: 'string' },
  },
  allowPositionals: false,
})

const DRY_RUN = !values.commit

if (!process.env.SOURCE_DATABASE_URL) {
  console.error('❌ SOURCE_DATABASE_URL is required (points to recovered DB)')
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is required (points to target DB)')
  process.exit(1)
}

const source = new PrismaClient({
  datasources: { db: { url: process.env.SOURCE_DATABASE_URL } },
})
const target = new PrismaClient()

type SourceMeta = {
  userId: string
  verifiedByUserId: string | null
  comment: string | null
  source: string | null
}

type SourcePeriod = {
  id: string
  companyId: string
  reportURL: string | null
  startDate: Date
  endDate: Date
  year: string
}

// Fetch the latest metadata row for an entity from the recovered DB
async function lastMeta(field: string, id: string): Promise<SourceMeta | null> {
  const fieldToQuery: Record<string, () => Promise<SourceMeta[]>> = {
    reportingPeriodId: () =>
      source.$queryRaw`SELECT "userId","verifiedByUserId",comment,source FROM "Metadata" WHERE "reportingPeriodId"=${id} ORDER BY "updatedAt" DESC LIMIT 1`,
    scope1Id: () =>
      source.$queryRaw`SELECT "userId","verifiedByUserId",comment,source FROM "Metadata" WHERE "scope1Id"=${id} ORDER BY "updatedAt" DESC LIMIT 1`,
    scope2Id: () =>
      source.$queryRaw`SELECT "userId","verifiedByUserId",comment,source FROM "Metadata" WHERE "scope2Id"=${id} ORDER BY "updatedAt" DESC LIMIT 1`,
    scope1And2Id: () =>
      source.$queryRaw`SELECT "userId","verifiedByUserId",comment,source FROM "Metadata" WHERE "scope1And2Id"=${id} ORDER BY "updatedAt" DESC LIMIT 1`,
    scope3Id: () =>
      source.$queryRaw`SELECT "userId","verifiedByUserId",comment,source FROM "Metadata" WHERE "scope3Id"=${id} ORDER BY "updatedAt" DESC LIMIT 1`,
    biogenicEmissionsId: () =>
      source.$queryRaw`SELECT "userId","verifiedByUserId",comment,source FROM "Metadata" WHERE "biogenicEmissionsId"=${id} ORDER BY "updatedAt" DESC LIMIT 1`,
    statedTotalEmissionsId: () =>
      source.$queryRaw`SELECT "userId","verifiedByUserId",comment,source FROM "Metadata" WHERE "statedTotalEmissionsId"=${id} ORDER BY "updatedAt" DESC LIMIT 1`,
    categoryId: () =>
      source.$queryRaw`SELECT "userId","verifiedByUserId",comment,source FROM "Metadata" WHERE "categoryId"=${id} ORDER BY "updatedAt" DESC LIMIT 1`,
    turnoverId: () =>
      source.$queryRaw`SELECT "userId","verifiedByUserId",comment,source FROM "Metadata" WHERE "turnoverId"=${id} ORDER BY "updatedAt" DESC LIMIT 1`,
    employeesId: () =>
      source.$queryRaw`SELECT "userId","verifiedByUserId",comment,source FROM "Metadata" WHERE "employeesId"=${id} ORDER BY "updatedAt" DESC LIMIT 1`,
  }
  const query = fieldToQuery[field]
  if (!query) throw new Error(`Unknown metadata field: ${field}`)
  const rows = (await query()) as SourceMeta[]
  return rows[0] ?? null
}

// Write a metadata row in target only if none already exist for this entity
async function restoreMeta(
  tx: Awaited<Parameters<Parameters<typeof target.$transaction>[0]>[0]>,
  field: string,
  entityId: string,
  meta: SourceMeta | null
) {
  if (!meta) return
  const existing = await (tx.metadata as any).findFirst({
    where: { [field]: entityId },
    select: { id: true },
  })
  if (existing) return
  await (tx.metadata as any).create({
    data: {
      [field]: entityId,
      userId: meta.userId,
      verifiedByUserId: meta.verifiedByUserId ?? undefined,
      comment: meta.comment ?? undefined,
      source: meta.source ?? undefined,
    },
  })
}

async function restoreEmissions(
  tx: Awaited<Parameters<Parameters<typeof target.$transaction>[0]>[0]>,
  srcEmissionsId: string,
  targetEmissionsId: string
) {
  // Scope1
  const [scope1] = await source.$queryRaw<
    { id: string; total: number | null; unit: string }[]
  >`SELECT id,total,unit FROM "Scope1" WHERE "emissionsId"=${srcEmissionsId}`
  if (scope1) {
    const n = await tx.scope1.create({
      data: {
        emissionsId: targetEmissionsId,
        total: scope1.total,
        unit: scope1.unit,
      },
      select: { id: true },
    })
    await restoreMeta(
      tx,
      'scope1Id',
      n.id,
      await lastMeta('scope1Id', scope1.id)
    )
  }

  // Scope2
  const [scope2] = await source.$queryRaw<
    {
      id: string
      mb: number | null
      lb: number | null
      unknown: number | null
      unit: string
    }[]
  >`SELECT id,mb,lb,unknown,unit FROM "Scope2" WHERE "emissionsId"=${srcEmissionsId}`
  if (scope2) {
    const n = await tx.scope2.create({
      data: {
        emissionsId: targetEmissionsId,
        mb: scope2.mb,
        lb: scope2.lb,
        unknown: scope2.unknown,
        unit: scope2.unit,
      },
      select: { id: true },
    })
    await restoreMeta(
      tx,
      'scope2Id',
      n.id,
      await lastMeta('scope2Id', scope2.id)
    )
  }

  // Scope1And2
  const [s12] = await source.$queryRaw<
    { id: string; total: number | null; unit: string }[]
  >`SELECT id,total,unit FROM "Scope1And2" WHERE "emissionsId"=${srcEmissionsId}`
  if (s12) {
    const n = await tx.scope1And2.create({
      data: {
        emissionsId: targetEmissionsId,
        total: s12.total,
        unit: s12.unit,
      },
      select: { id: true },
    })
    await restoreMeta(
      tx,
      'scope1And2Id',
      n.id,
      await lastMeta('scope1And2Id', s12.id)
    )
  }

  // BiogenicEmissions
  const [bio] = await source.$queryRaw<
    { id: string; total: number | null; unit: string }[]
  >`SELECT id,total,unit FROM "BiogenicEmissions" WHERE "emissionsId"=${srcEmissionsId}`
  if (bio) {
    const n = await tx.biogenicEmissions.create({
      data: {
        emissionsId: targetEmissionsId,
        total: bio.total,
        unit: bio.unit,
      },
      select: { id: true },
    })
    await restoreMeta(
      tx,
      'biogenicEmissionsId',
      n.id,
      await lastMeta('biogenicEmissionsId', bio.id)
    )
  }

  // StatedTotalEmissions at emissions level (not linked to a Scope3)
  const [ste] = await source.$queryRaw<
    {
      id: string
      total: number | null
      unit: string
      scope3Id: string | null
    }[]
  >`SELECT id,total,unit,"scope3Id" FROM "StatedTotalEmissions" WHERE "emissionsId"=${srcEmissionsId}`
  if (ste && !ste.scope3Id) {
    // Belongs to Emissions directly, not inside a Scope3
    const n = await tx.statedTotalEmissions.create({
      data: {
        emissionsId: targetEmissionsId,
        total: ste.total,
        unit: ste.unit,
      },
      select: { id: true },
    })
    await restoreMeta(
      tx,
      'statedTotalEmissionsId',
      n.id,
      await lastMeta('statedTotalEmissionsId', ste.id)
    )
  }

  // Scope3
  const [scope3] = await source.$queryRaw<
    { id: string; statedTotalEmissionsId: string | null }[]
  >`SELECT id,"statedTotalEmissionsId" FROM "Scope3" WHERE "emissionsId"=${srcEmissionsId}`
  if (scope3) {
    // Create Scope3 first without the statedTotalEmissions link (avoid circular FK)
    const newScope3 = await tx.scope3.create({
      data: { emissionsId: targetEmissionsId },
      select: { id: true },
    })
    await restoreMeta(
      tx,
      'scope3Id',
      newScope3.id,
      await lastMeta('scope3Id', scope3.id)
    )

    // StatedTotalEmissions linked to this Scope3
    if (scope3.statedTotalEmissionsId) {
      const [s3ste] = await source.$queryRaw<
        { id: string; total: number | null; unit: string }[]
      >`SELECT id,total,unit FROM "StatedTotalEmissions" WHERE id=${scope3.statedTotalEmissionsId}`
      if (s3ste) {
        const newSte = await tx.statedTotalEmissions.create({
          data: {
            scope3Id: newScope3.id,
            total: s3ste.total,
            unit: s3ste.unit,
          },
          select: { id: true },
        })
        await tx.scope3.update({
          where: { id: newScope3.id },
          data: { statedTotalEmissionsId: newSte.id },
        })
        await restoreMeta(
          tx,
          'statedTotalEmissionsId',
          newSte.id,
          await lastMeta('statedTotalEmissionsId', s3ste.id)
        )
      }
    }

    // Scope3Categories
    const cats = await source.$queryRaw<
      {
        id: string
        category: number
        total: number | null
        unit: string | null
      }[]
    >`SELECT id,category,total,unit FROM "Scope3Category" WHERE "scope3Id"=${scope3.id}`
    for (const cat of cats) {
      const newCat = await tx.scope3Category.create({
        data: {
          scope3Id: newScope3.id,
          category: cat.category,
          total: cat.total,
          unit: cat.unit,
        },
        select: { id: true },
      })
      await restoreMeta(
        tx,
        'categoryId',
        newCat.id,
        await lastMeta('categoryId', cat.id)
      )
    }
  }
}

async function restoreEconomy(
  tx: Awaited<Parameters<Parameters<typeof target.$transaction>[0]>[0]>,
  srcEconomyId: string,
  periodId: string
) {
  const newEconomy = await tx.economy.create({
    data: { reportingPeriodId: periodId },
    select: { id: true },
  })

  const [turnover] = await source.$queryRaw<
    { id: string; value: number | null; currency: string | null }[]
  >`SELECT id,value,currency FROM "Turnover" WHERE "economyId"=${srcEconomyId}`
  if (turnover) {
    const n = await tx.turnover.create({
      data: {
        economyId: newEconomy.id,
        value: turnover.value,
        currency: turnover.currency,
      },
      select: { id: true },
    })
    await restoreMeta(
      tx,
      'turnoverId',
      n.id,
      await lastMeta('turnoverId', turnover.id)
    )
  }

  const [employees] = await source.$queryRaw<
    { id: string; value: number | null; unit: string | null }[]
  >`SELECT id,value,unit FROM "Employees" WHERE "economyId"=${srcEconomyId}`
  if (employees) {
    const n = await tx.employees.create({
      data: {
        economyId: newEconomy.id,
        value: employees.value,
        unit: employees.unit,
      },
      select: { id: true },
    })
    await restoreMeta(
      tx,
      'employeesId',
      n.id,
      await lastMeta('employeesId', employees.id)
    )
  }
}

async function main() {
  console.log(
    `\n🔍 Mode: ${DRY_RUN ? 'DRY RUN (pass --commit to write)' : '✅ COMMIT'}\n`
  )

  // Companies where recovered max year is 2024 (optionally filtered to one)
  const recoveredCompanies = values.company
    ? [{ companyId: values.company }]
    : await source.$queryRaw<{ companyId: string }[]>`
        SELECT "companyId"
        FROM "ReportingPeriod"
        GROUP BY "companyId"
        HAVING MAX(year) = '2024'
      `

  console.log(
    `📦 ${recoveredCompanies.length} companies with max year 2024 in recovered DB\n`
  )

  const stats = {
    companies_targeted: 0,
    companies_skipped_not_in_prod: 0,
    companies_skipped_prod_not_updated: 0,
    periods_created: 0,
    periods_already_exist: 0,
    errors: 0,
  }

  try {
    await target.$transaction(
      async (tx) => {
        for (const { companyId } of recoveredCompanies) {
          const company = await tx.company.findUnique({
            where: { wikidataId: companyId },
            select: { wikidataId: true, name: true },
          })
          if (!company) {
            stats.companies_skipped_not_in_prod++
            continue
          }

          const label = `${company.name} (${companyId})`

          // Only migrate companies where prod already has a 2025 report —
          // these are the ones who lost their 2024 data when Garbo moved forward
          const prodLatest = await tx.reportingPeriod.findFirst({
            where: { companyId },
            orderBy: { year: 'desc' },
            select: { year: true },
          })
          if (!prodLatest || prodLatest.year <= '2024') {
            console.log(
              `⏭  ${label}: prod max year is ${prodLatest?.year ?? 'none'} — already at or before 2024, skipping`
            )
            stats.companies_skipped_prod_not_updated++
            continue
          }

          stats.companies_targeted++

          // All periods for this company in backup, ordered newest first
          const periods = await source.$queryRaw<SourcePeriod[]>`
              SELECT id,"companyId","reportURL","startDate","endDate",year
              FROM "ReportingPeriod"
              WHERE "companyId"=${companyId}
              ORDER BY year DESC
            `

          const backupMaxYear = periods[0]?.year ?? '?'
          const backupYears = periods.map((p) => p.year).join(', ')

          // Use the URL from the most recent period that has one as the anchor for the new Report
          const reportUrl = periods.find((p) => p.reportURL)?.reportURL ?? null

          console.log(`\n🏢 ${label}`)
          console.log(
            `   Prod max year: ${prodLatest.year} | Backup years: ${backupYears}`
          )
          console.log(
            `   Report URL (from most recent backup period with a URL): ${reportUrl ?? 'none'}`
          )

          if (!reportUrl) {
            console.log(
              `   ⚠  No URL found in any backup period — cannot create Report, skipping company`
            )
            stats.errors++
            continue
          }

          // Find or create Report using the backup URL
          let report = await tx.report.findFirst({
            where: { OR: [{ url: reportUrl }, { sourceUrl: reportUrl }] },
            select: { id: true },
          })
          if (report) {
            console.log(`   Report: already exists in prod (reusing)`)
          } else {
            report = await tx.report.create({
              data: {
                url: reportUrl,
                reportYear: backupMaxYear,
                companyName: company.name,
                wikidataId: company.wikidataId ?? undefined,
              },
              select: { id: true },
            })
            console.log(`   Report: did not exist in prod → created new`)
          }

          // Find or create CompanyReport linking this company to the 2024 report
          let companyReport = await tx.companyReport.findFirst({
            where: { companyId, registryReportId: report.id },
            select: { id: true },
          })
          if (companyReport) {
            console.log(
              `   CompanyReport (${company.name} ↔ 2024 report): already exists`
            )
          } else {
            companyReport = await tx.companyReport.create({
              data: {
                companyId,
                registryReportId: report.id,
                reportYear: backupMaxYear,
              },
              select: { id: true },
            })
            console.log(
              `   CompanyReport (${company.name} ↔ 2024 report): created new (reportYear=${backupMaxYear})`
            )
          }

          // Restore ALL periods from backup under this CompanyReport
          for (const period of periods) {
            // Idempotency: check by (companyReportId, year) — the real unique key.
            // Do not rely on reportURL in prod; it may have been overwritten.
            const existing = await tx.reportingPeriod.findFirst({
              where: { companyReportId: companyReport.id, year: period.year },
              select: { id: true },
            })
            if (existing) {
              console.log(
                `   ${period.year}: already exists under this CompanyReport — skipping`
              )
              stats.periods_already_exist++
              continue
            }

            const newPeriod = await tx.reportingPeriod.create({
              data: {
                companyId,
                companyReportId: companyReport.id,
                year: period.year,
                startDate: period.startDate,
                endDate: period.endDate,
                reportURL: period.reportURL,
              },
              select: { id: true },
            })
            await restoreMeta(
              tx,
              'reportingPeriodId',
              newPeriod.id,
              await lastMeta('reportingPeriodId', period.id)
            )

            const [srcEmissions] = await source.$queryRaw<{ id: string }[]>`
                SELECT id FROM "Emissions" WHERE "reportingPeriodId"=${period.id}
              `
            if (srcEmissions) {
              const newEmissions = await tx.emissions.create({
                data: { reportingPeriodId: newPeriod.id },
                select: { id: true },
              })
              await restoreEmissions(tx, srcEmissions.id, newEmissions.id)
            }

            const [srcEconomy] = await source.$queryRaw<{ id: string }[]>`
                SELECT id FROM "Economy" WHERE "reportingPeriodId"=${period.id}
              `
            if (srcEconomy) {
              await restoreEconomy(tx, srcEconomy.id, newPeriod.id)
            }

            console.log(
              `   ✅ ${period.year}: created with full emissions + economy + metadata`
            )
            stats.periods_created++
          }
        }

        if (DRY_RUN) throw new Error('DRY_RUN_ROLLBACK')
      },
      { timeout: 300_000 }
    )
  } catch (err) {
    if (err instanceof Error && err.message === 'DRY_RUN_ROLLBACK') {
      console.log('\n🔁 Dry run complete — all changes rolled back')
    } else {
      throw err
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   Companies targeted        : ${stats.companies_targeted}`)
  console.log(
    `   Companies not in prod     : ${stats.companies_skipped_not_in_prod}`
  )
  console.log(
    `   Companies prod at ≤2024   : ${stats.companies_skipped_prod_not_updated}`
  )
  console.log(`   Periods created           : ${stats.periods_created}`)
  console.log(`   Periods already exist     : ${stats.periods_already_exist}`)
  console.log(`   Errors                    : ${stats.errors}`)

  if (DRY_RUN && stats.periods_created > 0) {
    console.log(
      `\n👉 Re-run with --commit to apply ${stats.periods_created} new periods`
    )
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await source.$disconnect()
    await target.$disconnect()
  })
