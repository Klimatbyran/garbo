export type VerificationCounter = { verified: number; unverified: number; withValues: number };

export const debugCounters = {
  productionScope2Fields: 0,
  comparisonScope2Fields: 0,
  filteredOutUnverified: 0,
  scope2FilteredOutUnverified: 0,
  filteredOutNoStagingData: 0,
  filteredOutNoStagingCompany: 0,
  companiesProcessed: 0,
  periodsProcessed: 0,
  missingCompanies: [] as Array<{ wikidataId: string; name: string; scope2Fields: number }>,
  scope2FieldsInDiffs: 0,
  scope2StagingOnlyFields: 0,
  scope2StagingOnlyFiltered: 0
};

export function incrementVerificationCounter(
  counter: VerificationCounter,
  isVerified: boolean
) {
  counter.withValues++;
  if (isVerified) {
    counter.verified++;
  } else {
    counter.unverified++;
  }
}

export function incrementScope2FieldCounters(
  scope2Value: number | null | undefined,
  isVerified: boolean,
  scope2Counter: VerificationCounter
) {
  if (scope2Value == null) {
    return;
  }

  debugCounters.productionScope2Fields++;
  incrementVerificationCounter(scope2Counter, isVerified);
}

export function logDebugCounters() {
  console.log(`\n🔧 DEBUGGING DISCREPANCIES:`);
  console.log(`📈 Companies processed: ${debugCounters.companiesProcessed}`);
  console.log(`📅 Periods processed: ${debugCounters.periodsProcessed}`);
  console.log(`❌ Filtered out (no staging company): ${debugCounters.filteredOutNoStagingCompany}`);
  console.log(`❌ Filtered out (no staging data): ${debugCounters.filteredOutNoStagingData}`);
  console.log(`📊 Scope2 fields in production data: ${debugCounters.productionScope2Fields}`);
  console.log(`🔄 Scope2 fields in comparison: ${debugCounters.comparisonScope2Fields}`);
  console.log(`🚫 All fields filtered out (unverified): ${debugCounters.filteredOutUnverified}`);
  console.log(`🚫 Scope2 fields filtered out (unverified): ${debugCounters.scope2FilteredOutUnverified}`);
  console.log(`✅ Scope2 fields that made it to diffs: ${debugCounters.scope2FieldsInDiffs}`);
  console.log(`🤖 Scope2 staging-only fields (AI hallucinations): ${debugCounters.scope2StagingOnlyFields}`);
  console.log(
    `🧮 CALCULATION: ${debugCounters.comparisonScope2Fields} - ${debugCounters.scope2FilteredOutUnverified} + ${debugCounters.scope2StagingOnlyFields} = ${
      debugCounters.comparisonScope2Fields -
      debugCounters.scope2FilteredOutUnverified +
      debugCounters.scope2StagingOnlyFields
    }`
  );
  console.log(
    `📉 Expected scope2 final count: ${
      debugCounters.comparisonScope2Fields -
      debugCounters.scope2FilteredOutUnverified +
      debugCounters.scope2StagingOnlyFields
    }`
  );

  if (debugCounters.missingCompanies.length > 0) {
    console.log(`\n🏢 COMPANIES MISSING FROM STAGING (with scope2 data):`);
    const totalMissingScope2Fields = debugCounters.missingCompanies.reduce(
      (sum, company) => sum + company.scope2Fields,
      0
    );
    console.log(`📊 Total scope2 fields in missing companies: ${totalMissingScope2Fields}`);
    console.log('='.repeat(60));
    debugCounters.missingCompanies.forEach(company => {
      console.log(
        `${company.name.padEnd(40)} | ${company.wikidataId} | ${company.scope2Fields} scope2 fields`
      );
    });
    console.log('='.repeat(60));
  }
}


