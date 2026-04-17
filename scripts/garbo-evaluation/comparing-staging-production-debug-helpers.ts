import * as z from 'zod'
import * as schemas from '../../src/api/schemas'

type CompanyList = z.infer<typeof schemas.CompanyList>

export type VerificationCounter = {
  verified: number
  unverified: number
  withValues: number
}

export const debugCounters = {
  productionScope2Fields: 0,
  comparisonScope2Fields: 0,
  filteredOutUnverified: 0,
  scope2FilteredOutUnverified: 0,
  filteredOutNoStagingData: 0,
  filteredOutNoStagingCompany: 0,
  companiesProcessed: 0,
  periodsProcessed: 0,
  missingCompanies: [] as Array<{
    wikidataId: string
    name: string
    scope2Fields: number
  }>,
  scope2FieldsInDiffs: 0,
  scope2StagingOnlyFields: 0,
  scope2StagingOnlyFiltered: 0,
}

export function incrementVerificationCounter(
  counter: VerificationCounter,
  isVerified: boolean
) {
  counter.withValues++
  if (isVerified) {
    counter.verified++
  } else {
    counter.unverified++
  }
}

export function incrementScope2FieldCounters(
  scope2Value: number | null | undefined,
  isVerified: boolean,
  scope2Counter: VerificationCounter
) {
  if (scope2Value == null) {
    return
  }

  debugCounters.productionScope2Fields++
  incrementVerificationCounter(scope2Counter, isVerified)
}

export function outputVerificationCounts(
  productionCompanies: CompanyList,
  reportingYear?: string
) {
  const counts: Record<
    | 'scope1'
    | 'scope2'
    | 'scope1And2'
    | 'scope3'
    | 'statedTotal'
    | 'employees'
    | 'turnover',
    VerificationCounter
  > = {
    scope1: { verified: 0, unverified: 0, withValues: 0 },
    scope2: { verified: 0, unverified: 0, withValues: 0 },
    scope1And2: { verified: 0, unverified: 0, withValues: 0 },
    scope3: { verified: 0, unverified: 0, withValues: 0 },
    statedTotal: { verified: 0, unverified: 0, withValues: 0 },
    employees: { verified: 0, unverified: 0, withValues: 0 },
    turnover: { verified: 0, unverified: 0, withValues: 0 },
  }

  for (const company of productionCompanies) {
    for (const period of company.reportingPeriods) {
      // Filter by year if specified
      if (reportingYear) {
        const periodStartDate =
          typeof period.startDate === 'string'
            ? period.startDate
            : period.startDate.toString()
        if (!periodStartDate.includes(reportingYear)) continue
      }

      // Scope1
      if (period.emissions?.scope1?.total != null) {
        incrementVerificationCounter(
          counts.scope1,
          period.emissions.scope1.metadata.verifiedBy != null
        )
      }

      // Scope2 (lb, mb, unknown)
      const scope2 = period.emissions?.scope2
      if (scope2) {
        const scope2IsVerified = scope2.metadata.verifiedBy != null
        incrementScope2FieldCounters(scope2.lb, scope2IsVerified, counts.scope2)
        incrementScope2FieldCounters(scope2.mb, scope2IsVerified, counts.scope2)
        incrementScope2FieldCounters(
          scope2.unknown,
          scope2IsVerified,
          counts.scope2
        )
      }

      // Scope1And2
      if (period.emissions?.scope1And2?.total != null) {
        incrementVerificationCounter(
          counts.scope1And2,
          period.emissions.scope1And2.metadata.verifiedBy != null
        )
      }

      // Scope3 categories
      if (period.emissions?.scope3?.categories) {
        for (const category of period.emissions.scope3.categories) {
          if (category.total != null) {
            incrementVerificationCounter(
              counts.scope3,
              category.metadata.verifiedBy != null
            )
          }
        }
      }

      // Stated Total Emissions
      if (period.emissions?.statedTotalEmissions?.total != null) {
        incrementVerificationCounter(
          counts.statedTotal,
          period.emissions.statedTotalEmissions.metadata.verifiedBy != null
        )
      }

      // Economy fields
      if (period.economy?.employees?.value != null) {
        incrementVerificationCounter(
          counts.employees,
          period.economy.employees.metadata.verifiedBy != null
        )
      }

      if (period.economy?.turnover?.value != null) {
        incrementVerificationCounter(
          counts.turnover,
          period.economy.turnover.metadata.verifiedBy != null
        )
      }
    }
  }

  console.log(
    `\n📊 Verification Counts${reportingYear ? ` for ${reportingYear}` : ' (all years)'}`
  )
  console.log('='.repeat(50))

  Object.entries(counts).forEach(([scope, count]) => {
    const total = count.verified + count.unverified
    const verifiedPct =
      total > 0 ? ((count.verified / total) * 100).toFixed(1) : '0.0'
    console.log(
      `${scope.padEnd(12)}: ${count.withValues
        .toString()
        .padStart(3)} with values | ${count.verified
        .toString()
        .padStart(3)} verified (${verifiedPct}%) | ${count.unverified
        .toString()
        .padStart(3)} unverified`
    )
  })
  console.log('='.repeat(50))
  console.log(
    `🔍 DEBUG: Production scope2 fields found: ${debugCounters.productionScope2Fields}`
  )
}

export function logDebugCounters() {
  console.log(`\n🔧 DEBUGGING DISCREPANCIES:`)
  console.log(`📈 Companies processed: ${debugCounters.companiesProcessed}`)
  console.log(`📅 Periods processed: ${debugCounters.periodsProcessed}`)
  console.log(
    `❌ Filtered out (no staging company): ${debugCounters.filteredOutNoStagingCompany}`
  )
  console.log(
    `❌ Filtered out (no staging data): ${debugCounters.filteredOutNoStagingData}`
  )
  console.log(
    `📊 Scope2 fields in production data: ${debugCounters.productionScope2Fields}`
  )
  console.log(
    `🔄 Scope2 fields in comparison: ${debugCounters.comparisonScope2Fields}`
  )
  console.log(
    `🚫 All fields filtered out (unverified): ${debugCounters.filteredOutUnverified}`
  )
  console.log(
    `🚫 Scope2 fields filtered out (unverified): ${debugCounters.scope2FilteredOutUnverified}`
  )
  console.log(
    `✅ Scope2 fields that made it to diffs: ${debugCounters.scope2FieldsInDiffs}`
  )
  console.log(
    `🤖 Scope2 staging-only fields (AI hallucinations): ${debugCounters.scope2StagingOnlyFields}`
  )
  console.log(
    `🧮 CALCULATION: ${debugCounters.comparisonScope2Fields} - ${debugCounters.scope2FilteredOutUnverified} + ${debugCounters.scope2StagingOnlyFields} = ${
      debugCounters.comparisonScope2Fields -
      debugCounters.scope2FilteredOutUnverified +
      debugCounters.scope2StagingOnlyFields
    }`
  )
  console.log(
    `📉 Expected scope2 final count: ${
      debugCounters.comparisonScope2Fields -
      debugCounters.scope2FilteredOutUnverified +
      debugCounters.scope2StagingOnlyFields
    }`
  )

  if (debugCounters.missingCompanies.length > 0) {
    console.log(`\n🏢 COMPANIES MISSING FROM STAGING (with scope2 data):`)
    const totalMissingScope2Fields = debugCounters.missingCompanies.reduce(
      (sum, company) => sum + company.scope2Fields,
      0
    )
    console.log(
      `📊 Total scope2 fields in missing companies: ${totalMissingScope2Fields}`
    )
    console.log('='.repeat(60))
    debugCounters.missingCompanies.forEach((company) => {
      console.log(
        `${company.name.padEnd(40)} | ${company.wikidataId} | ${company.scope2Fields} scope2 fields`
      )
    })
    console.log('='.repeat(60))
  }
}
