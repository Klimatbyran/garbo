/**
 * Restore validated Scope1 data from a recovered DB into the target DB,
 * adapting to the new CompanyReport-based ReportingPeriod structure.
 *
 * For each 2024 company in the recovered DB that has a human-verified Scope1,
 * this script finds or creates the Report → CompanyReport → ReportingPeriod →
 * Emissions → Scope1 chain in the target DB, then adds a validated Metadata row.
 *
 * Defaults to dry-run. Pass --commit to write.
 *
 * Usage (local):
 *   SOURCE_DATABASE_URL=postgresql://postgres@localhost:5433/recovered \
 *   DATABASE_URL=postgresql://postgres:<local-password>@localhost:5432/garbo \
 *   node --import dotenv/config --import tsx scripts/restore-validated-scope1.ts
 *
 *   # Actually commit:
 *   ... --commit
 *
 * Usage (cluster): see k8s/jobs/README.md
 */

import { PrismaClient } from '@prisma/client'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    commit: { type: 'boolean', default: false },
    year: { type: 'string', default: '2024' },
  },
  allowPositionals: false,
})

const DRY_RUN = !values.commit
const YEAR = values.year as string

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

type RecoveredRow = {
  companyId: string
  reportURL: string | null
  startDate: Date
  endDate: Date
  total: number | null
  unit: string
  userId: string
  verifiedByUserId: string
  comment: string | null
  source: string | null
}

async function main() {
  console.log(
    `\n🔍 Mode: ${DRY_RUN ? 'DRY RUN (pass --commit to write)' : '✅ COMMIT'}`
  )
  console.log(`📅 Year: ${YEAR}\n`)

  const rows = await source.$queryRaw<RecoveredRow[]>`
    WITH latest_human_verified AS (
      SELECT DISTINCT ON (m."scope1Id")
        m."scope1Id",
        m."userId",
        m."verifiedByUserId",
        m.comment,
        m.source
      FROM "Metadata" m
      JOIN "User" uv ON uv.id = m."verifiedByUserId"
      WHERE uv.bot = false
      ORDER BY m."scope1Id", m."updatedAt" DESC
    )
    SELECT
      rp."companyId",
      rp."reportURL",
      rp."startDate",
      rp."endDate",
      s1.total,
      s1.unit,
      lhv."userId",
      lhv."verifiedByUserId",
      lhv.comment,
      lhv.source
    FROM "ReportingPeriod" rp
    JOIN "Emissions" e ON e."reportingPeriodId" = rp.id
    JOIN "Scope1" s1 ON s1."emissionsId" = e.id
    JOIN latest_human_verified lhv ON lhv."scope1Id" = s1.id
    WHERE rp.year = ${YEAR}
    ORDER BY rp."companyId"
  `

  console.log(
    `📦 Found ${rows.length} validated Scope1 rows in recovered DB for year ${YEAR}\n`
  )

  const stats = {
    created: 0,
    alreadyValidated: 0,
    noCompany: 0,
    noReportURL: 0,
    errors: 0,
  }

  try {
    await target.$transaction(
      async (tx) => {
        for (const row of rows) {
          try {
            // 1. Verify company exists in target
            const company = await tx.company.findUnique({
              where: { wikidataId: row.companyId },
              select: { wikidataId: true, name: true },
            })
            if (!company) {
              console.log(`⚠  ${row.companyId}: not in target DB, skipping`)
              stats.noCompany++
              continue
            }

            const label = `${company.name} (${row.companyId})`

            if (!row.reportURL) {
              console.log(`⚠  ${label}: no reportURL in recovered, skipping`)
              stats.noReportURL++
              continue
            }

            // 2. Find existing ReportingPeriod by the original reportURL.
            //    In prod, the PDF may have been copied to GCS (Report.url = GCS URL) but
            //    ReportingPeriod.reportURL still holds the original web URL — same as recovered.
            //    Going through Report.url would fail to match, so we skip that and look up
            //    the period directly by (companyId, year, reportURL).
            let reportingPeriod = await tx.reportingPeriod.findFirst({
              where: {
                companyId: row.companyId,
                year: YEAR,
                reportURL: row.reportURL,
              },
              select: { id: true },
            })

            if (!reportingPeriod) {
              // No existing period for this URL — build the full chain
              let report = await tx.report.findFirst({
                where: {
                  OR: [{ url: row.reportURL }, { sourceUrl: row.reportURL }],
                },
                select: { id: true },
              })
              if (!report) {
                report = await tx.report.create({
                  data: { url: row.reportURL },
                  select: { id: true },
                })
                console.log(`  📄 ${label}: created Report`)
              }

              let companyReport = await tx.companyReport.findFirst({
                where: {
                  companyId: row.companyId,
                  registryReportId: report.id,
                },
                select: { id: true },
              })
              if (!companyReport) {
                companyReport = await tx.companyReport.create({
                  data: {
                    companyId: row.companyId,
                    registryReportId: report.id,
                    reportYear: YEAR,
                  },
                  select: { id: true },
                })
              }

              reportingPeriod = await tx.reportingPeriod.create({
                data: {
                  companyId: row.companyId,
                  companyReportId: companyReport.id,
                  year: YEAR,
                  startDate: row.startDate,
                  endDate: row.endDate,
                  reportURL: row.reportURL,
                },
                select: { id: true },
              })
            }

            // 3. Find or create Emissions
            let emissions = await tx.emissions.findUnique({
              where: { reportingPeriodId: reportingPeriod.id },
              select: { id: true },
            })
            if (!emissions) {
              emissions = await tx.emissions.create({
                data: { reportingPeriodId: reportingPeriod.id },
                select: { id: true },
              })
            }

            // 4. Check for existing validated Scope1 before touching any values.
            //    If already validated with a newer value, leave it alone.
            const existingScope1 = await tx.scope1.findUnique({
              where: { emissionsId: emissions.id },
              select: { id: true },
            })

            if (existingScope1) {
              const existingValidation = await tx.metadata.findFirst({
                where: {
                  scope1Id: existingScope1.id,
                  verifiedByUserId: { not: null },
                },
                select: { id: true },
              })
              if (existingValidation) {
                console.log(
                  `✓  ${label}: already validated in target, skipping`
                )
                stats.alreadyValidated++
                continue
              }
              // No newer validation — overwrite with the human-validated value from recovered
              await tx.scope1.update({
                where: { id: existingScope1.id },
                data: { total: row.total, unit: row.unit },
              })
            }

            const scope1 =
              existingScope1 ??
              (await tx.scope1.create({
                data: {
                  emissionsId: emissions.id,
                  total: row.total,
                  unit: row.unit,
                },
                select: { id: true },
              }))

            // 5. Add validated Metadata
            await tx.metadata.create({
              data: {
                scope1Id: scope1.id,
                userId: row.userId,
                verifiedByUserId: row.verifiedByUserId,
                comment: row.comment,
                source: row.source ?? row.reportURL,
              },
            })

            console.log(
              `✅ ${label}: scope1=${row.total} ${row.unit} restored with validation`
            )
            stats.created++
          } catch (err) {
            console.error(`❌ ${row.companyId}: ${err}`)
            stats.errors++
          }
        }

        if (DRY_RUN) {
          throw new Error('DRY_RUN_ROLLBACK')
        }
      },
      { timeout: 120_000 }
    )
  } catch (err) {
    if (err instanceof Error && err.message === 'DRY_RUN_ROLLBACK') {
      console.log('\n🔁 Dry run complete — all changes rolled back')
    } else {
      throw err
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   Restored with validation : ${stats.created}`)
  console.log(`   Already validated        : ${stats.alreadyValidated}`)
  console.log(`   Company not in target    : ${stats.noCompany}`)
  console.log(`   No reportURL             : ${stats.noReportURL}`)
  console.log(`   Errors                   : ${stats.errors}`)

  if (DRY_RUN && stats.created > 0) {
    console.log(`\n👉 Re-run with --commit to apply ${stats.created} changes`)
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
