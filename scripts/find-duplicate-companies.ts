/**
 * Find potential duplicate Company rows for manual review.
 *
 * Detection signals (same rules as pipeline company-link matching):
 * - **normalized_name** — names equal after stripping legal suffixes (Alfa Laval AB vs Alfa Laval)
 * - **lei** — same LEI on `Company.lei` or `CompanyIdentifier` (type LEI)
 * - **wikidata_conflict** — same normalized name but different non-null Wikidata Q-ids
 *
 * Usage:
 *   npm run find-duplicate-companies
 *   npm run find-duplicate-companies -- --json=./duplicate-companies.json
 *   npm run find-duplicate-companies -- --csv=./duplicate-companies.csv
 *   npm run find-duplicate-companies -- --reason=wikidata_conflict
 *   npm run find-duplicate-companies -- --min-group-size=3
 */

import 'dotenv/config'
import { parseArgs } from 'node:util'
import { writeFileSync } from 'node:fs'

import { prisma } from '../src/lib/prisma'
import {
  findDuplicateCompanyGroups,
  type DuplicateDetectionReason,
  type DuplicateCompanyGroup,
} from '../src/lib/findDuplicateCompanyGroups'

const REASONS = [
  'normalized_name',
  'lei',
  'wikidata_conflict',
] as const satisfies readonly DuplicateDetectionReason[]

function formatCompanyLine(group: DuplicateCompanyGroup) {
  return group.companies
    .map((company) => {
      const wikidata = company.wikidataId ?? '—'
      const lei = company.lei ?? '—'
      return (
        `    ${company.id}  ${company.name}\n` +
        `      wikidata=${wikidata}  lei=${lei}  ` +
        `periods=${company.reportingPeriodCount}  reports=${company.companyReportCount}`
      )
    })
    .join('\n')
}

function toCsv(groups: DuplicateCompanyGroup[]): string {
  const header =
    'reason,group_key,company_id,company_name,wikidata_id,lei,reporting_period_count,company_report_count'
  const rows = groups.flatMap((group) =>
    group.companies.map((company) =>
      [
        group.reason,
        JSON.stringify(group.key),
        company.id,
        JSON.stringify(company.name),
        company.wikidataId ?? '',
        company.lei ?? '',
        company.reportingPeriodCount,
        company.companyReportCount,
      ].join(',')
    )
  )
  return [header, ...rows].join('\n')
}

async function main() {
  const { values } = parseArgs({
    options: {
      json: { type: 'string' },
      csv: { type: 'string' },
      reason: { type: 'string' },
      'min-group-size': { type: 'string', default: '2' },
      limit: { type: 'string' },
    },
    allowPositionals: false,
  })

  const minGroupSize = Math.max(2, Number(values['min-group-size']) || 2)
  const reasonFilter = values.reason?.trim() as
    | DuplicateDetectionReason
    | undefined
  if (reasonFilter && !REASONS.includes(reasonFilter)) {
    throw new Error(
      `Invalid --reason=${reasonFilter}. Use one of: ${REASONS.join(', ')}`
    )
  }

  const [companies, identifiers] = await Promise.all([
    prisma.company.findMany({
      select: {
        id: true,
        name: true,
        wikidataId: true,
        lei: true,
        _count: {
          select: {
            reportingPeriods: true,
            companyReports: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.companyIdentifier.findMany({
      where: { type: { in: ['LEI', 'WIKIDATA'] } },
      select: {
        companyId: true,
        type: true,
        value: true,
      },
    }),
  ])

  const report = findDuplicateCompanyGroups({
    companies: companies.map((company) => ({
      id: company.id,
      name: company.name,
      wikidataId: company.wikidataId,
      lei: company.lei,
      reportingPeriodCount: company._count.reportingPeriods,
      companyReportCount: company._count.companyReports,
    })),
    identifiers: identifiers.map((row) => ({
      companyId: row.companyId,
      type: row.type,
      value: row.value,
    })),
    minGroupSize,
  })

  const groups = reasonFilter
    ? report.groups.filter((group) => group.reason === reasonFilter)
    : report.groups

  const limit = values.limit ? Number(values.limit) : undefined
  const groupsToShow = limit && limit > 0 ? groups.slice(0, limit) : groups

  console.log('Duplicate company scan')
  console.log('======================')
  console.log(`Total companies:              ${report.totalCompanies}`)
  console.log(`Duplicate groups:             ${report.groupCount}`)
  console.log(`Companies in duplicate groups: ${report.companiesInGroups}`)
  console.log(
    `  normalized_name:            ${report.byReason.normalized_name}`
  )
  console.log(`  lei:                        ${report.byReason.lei}`)
  console.log(
    `  wikidata_conflict:          ${report.byReason.wikidata_conflict}`
  )
  console.log('')

  if (groupsToShow.length === 0) {
    console.log('No duplicate groups found.')
  } else {
    for (const group of groupsToShow) {
      console.log(
        `[${group.reason}] ${group.key} (${group.companies.length} companies)`
      )
      console.log(formatCompanyLine(group))
      console.log('')
    }
    if (limit && groups.length > groupsToShow.length) {
      console.log(
        `… showing ${groupsToShow.length} of ${groups.length} groups (use --limit to adjust)`
      )
    }
  }

  if (values.json) {
    writeFileSync(
      values.json,
      JSON.stringify({ ...report, groups }, null, 2),
      'utf8'
    )
    console.log(`Wrote JSON report to ${values.json}`)
  }

  if (values.csv) {
    writeFileSync(values.csv, toCsv(groups), 'utf8')
    console.log(`Wrote CSV report to ${values.csv}`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
