import 'dotenv/config';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import * as z from 'zod';
import * as schemas from '../../src/api/schemas';
import { fetchCompanies } from './utils/fetchUtils';
import { convertCompanyEvalsToCSV, generateXLSX } from './utils/outputFunctions';
import { reportStatistics, outputTotalStatistics } from './utils/statisticsFunctions';

type CompanyList = z.infer<typeof schemas.CompanyList>;
type ReportingPeriod  = z.infer<typeof schemas.MinimalReportingPeriodSchema>;
type CompanyResponse = z.infer<typeof schemas.MinimalCompanyBase>;
const NUMBER_OF_CATEGORIES = 16;
const ONLY_CHECK_VERIFIED_DATA = true;

export interface Diff {
  productionValue?: number;
  stagingValue?: number;
  difference?: number;
  differencePerct?: number;
}

export interface Company {
  wikidataId: string,
  name: string;
  diffReports: DiffReport[];
}

export interface DiffReport {
  reportingPeriod: {
    startDate: Date;
    endDate: Date;
  },
  diffs: {
    emissions: {
      scope1?: Diff;
      scope2: {
        lb?: Diff;
        mb?: Diff;
        unknown?: Diff;
      }
      scope1And2?: Diff;
      scope3:
        {
          categoryId: number;
          value?: Diff;
        }[],
      statedTotalEmissions?: Diff;
      biogenicEmissions?: Diff;
    }
    economy: {
      employees?: Diff;
      turnover?: Diff;
    }
  },
  eval: {
    accuracyNumericalFields?: {
      description?: string,
      value?: number,
      numbCorrectNumericalFields?: number,
      numbNumericalFields?: number
    };
    precision?: {
      description?: string,
      value?: number,
      numbHasActualValueAndIsExtracted?: number,
      numbExtractedValues?: number
    };
    recall?: {
      description?: string,
      value?: number,
      numbHasActualValueAndIsExtracted?: number,
      numbActualValues?: number
    };
    magnError?: {
      description?: string,
      value?: number,
      magnErr?: number,
      numbNumericalFields?: number
    };
    fieldSwapError?: {
      description?: string,
      value?: number,
      fieldSwap?: number,
      numbNumericalFields?: number
    }
  }
};


// Function to compare data between staging and production
function compareCompanyLists(productionCompanies: CompanyList, stagingCompanies: CompanyList, reportingYear?: string): Company[] {
  const companies: Company[] = [];
  for(const productionCompany of productionCompanies) {
    const stagingCompany = stagingCompanies.find((companyI) => companyI.wikidataId === productionCompany.wikidataId);
    if (stagingCompany) {
      debugCounters.companiesProcessed++;
      companies.push({
        name: productionCompany.name,
        wikidataId: productionCompany.wikidataId,
        diffReports: []
      })
      if (reportingYear) {
        const prodReportingPeriod = productionCompany?.reportingPeriods.find((period) => typeof period.startDate === 'string' ? period.startDate.includes(reportingYear) : period.startDate.toString().includes(reportingYear))
        const stagingReportingPeriod = prodReportingPeriod ? stagingCompany?.reportingPeriods.find((periodI) => periodI.startDate === prodReportingPeriod.startDate && periodI.endDate === prodReportingPeriod.endDate) : undefined;
        if(stagingReportingPeriod && prodReportingPeriod) {
          debugCounters.periodsProcessed++;
          const diffReport = compareReportingPeriods(prodReportingPeriod, stagingReportingPeriod, productionCompany);
          const existingCompany = companies.find((companyI) => companyI.wikidataId === productionCompany.wikidataId);
          existingCompany?.diffReports.push(diffReport);
        } else if (prodReportingPeriod) {
          debugCounters.filteredOutNoStagingData++;
        }
      }
      else {
        for(const reportingPeriod of productionCompany.reportingPeriods) {
          const stagingReportingPeriod = stagingCompany?.reportingPeriods.find((periodI) => periodI.startDate === reportingPeriod.startDate && periodI.endDate === reportingPeriod.endDate);
          if(stagingReportingPeriod) {
            debugCounters.periodsProcessed++;
            const diffReport = compareReportingPeriods(reportingPeriod, stagingReportingPeriod, productionCompany);
            const existingCompany = companies.find((companyI) => companyI.wikidataId === productionCompany.wikidataId);
            existingCompany?.diffReports.push(diffReport);
          } else {
            debugCounters.filteredOutNoStagingData++;
          }
        }
      }
    } else {
      debugCounters.filteredOutNoStagingCompany++;
      
      // Count scope2 fields for this missing company
      let scope2FieldsInMissingCompany = 0;
      for (const period of productionCompany.reportingPeriods) {
        // Filter by year if specified
        if (reportingYear) {
          const periodStartDate = typeof period.startDate === 'string' ? period.startDate : period.startDate.toString();
          if (!periodStartDate.includes(reportingYear)) continue;
        }
        
        const scope2 = period.emissions?.scope2;
        if (scope2?.lb != null) scope2FieldsInMissingCompany++;
        if (scope2?.mb != null) scope2FieldsInMissingCompany++;
        if (scope2?.unknown != null) scope2FieldsInMissingCompany++;
      }
      
      if (scope2FieldsInMissingCompany > 0) {
        debugCounters.missingCompanies.push({
          wikidataId: productionCompany.wikidataId,
          name: productionCompany.name,
          scope2Fields: scope2FieldsInMissingCompany
        });
      }
    }
  }

  return companies; 
}


function compareReportingPeriods(productionReportingPeriod: ReportingPeriod, stagingReportingPeriod: ReportingPeriod, productionCompany: CompanyResponse) {
  const diffReport: DiffReport = {
    reportingPeriod: {
      startDate:  new Date(productionReportingPeriod.startDate),
      endDate: new Date(productionReportingPeriod.endDate)
    },
    diffs: {
      emissions: {
        scope2: {},
        scope3: [],
      },
      economy: {}
    },
    eval: {}
  }

  const diffs: Diff[] = [];

  diffReport.diffs.emissions.scope1  = compareNumbers(
    productionReportingPeriod.emissions?.scope1?.total,
    stagingReportingPeriod.emissions?.scope1?.total,
    productionReportingPeriod.emissions?.scope1?.metadata.verifiedBy != null
  );
  diffs.push(diffReport.diffs.emissions.scope1);

  diffReport.diffs.emissions.scope2.lb = compareNumbers(
    productionReportingPeriod.emissions?.scope2?.lb,
    stagingReportingPeriod.emissions?.scope2?.lb,
    productionReportingPeriod.emissions?.scope2?.metadata.verifiedBy != null,
    'scope2.lb'
  );
  if (productionReportingPeriod.emissions?.scope2?.lb != null) {
    debugCounters.comparisonScope2Fields++;
  }
  diffs.push(diffReport.diffs.emissions.scope2.lb);

  diffReport.diffs.emissions.scope2.mb = compareNumbers(
    productionReportingPeriod.emissions?.scope2?.mb,
    stagingReportingPeriod.emissions?.scope2?.mb,
    productionReportingPeriod.emissions?.scope2?.metadata.verifiedBy != null,
    'scope2.mb'
  );
  if (productionReportingPeriod.emissions?.scope2?.mb != null) {
    debugCounters.comparisonScope2Fields++;
  }
  diffs.push(diffReport.diffs.emissions.scope2.mb);

  diffReport.diffs.emissions.scope2.unknown  = compareNumbers(
    productionReportingPeriod.emissions?.scope2?.unknown,
    stagingReportingPeriod.emissions?.scope2?.unknown,
    productionReportingPeriod.emissions?.scope2?.metadata.verifiedBy != null,
    'scope2.unknown'
  );
  if (productionReportingPeriod.emissions?.scope2?.unknown != null) {
    debugCounters.comparisonScope2Fields++;
  }
  diffs.push(diffReport.diffs.emissions.scope2.unknown);

  diffReport.diffs.emissions.scope1And2 = compareNumbers(
    productionReportingPeriod.emissions?.scope1And2?.total,
    stagingReportingPeriod.emissions?.scope1And2?.total,
    productionReportingPeriod.emissions?.scope1And2?.metadata.verifiedBy != null
  );
  diffs.push(diffReport.diffs.emissions.scope1And2);

  diffReport.diffs.emissions.statedTotalEmissions = compareNumbers(
    productionReportingPeriod.emissions?.statedTotalEmissions?.total,
    stagingReportingPeriod.emissions?.statedTotalEmissions?.total,
    productionReportingPeriod.emissions?.statedTotalEmissions?.metadata.verifiedBy != null
  );
  diffs.push(diffReport.diffs.emissions.statedTotalEmissions);

  for(let i = 1; i <= NUMBER_OF_CATEGORIES; i++) {
    const productionCategory = productionReportingPeriod.emissions?.scope3?.categories.find((categoryI) => categoryI.category === i) ?? undefined;
    const stagingCategory = stagingReportingPeriod.emissions?.scope3?.categories.find((categoryI) => categoryI.category === i) ?? undefined;   
    const diff = compareNumbers(productionCategory?.total, stagingCategory?.total, productionCategory?.metadata.verifiedBy != null); 
    diffs.push(diff)
    diffReport.diffs.emissions.scope3.push({
      categoryId: i,
      value: diff
    })
  }

  diffReport.diffs.economy.employees = compareNumbers(
    productionReportingPeriod.economy?.employees?.value,
    stagingReportingPeriod.economy?.employees?.value,
    productionReportingPeriod.economy?.employees?.metadata.verifiedBy != null
  );
  diffs.push(diffReport.diffs.economy.employees);

  diffReport.diffs.economy.turnover = compareNumbers(
    productionReportingPeriod.economy?.turnover?.value,
    stagingReportingPeriod.economy?.turnover?.value,
    productionReportingPeriod.economy?.turnover?.metadata.verifiedBy != null
  );
  diffs.push(diffReport.diffs.economy.turnover);

  diffReport.eval = reportStatistics(diffs)

  return diffReport;
}

function compareNumbers(productionNumber: number | undefined | null, stagingNumber: number | undefined | null, productionVerified?: boolean, fieldType?: string): Diff {
  // If we only check verified data and production is not verified, treat as non-existent
  if(ONLY_CHECK_VERIFIED_DATA && !productionVerified) {
    if (productionNumber != null) {
      debugCounters.filteredOutUnverified++;
      if (fieldType?.startsWith('scope2')) {
        debugCounters.scope2FilteredOutUnverified++;
      }
    }
    // Track staging-only fields that get filtered due to unverified production metadata
    if (fieldType?.startsWith('scope2') && productionNumber == null && stagingNumber != null) {
      debugCounters.scope2StagingOnlyFiltered++;
    }
    return {
      productionValue: undefined,
      stagingValue: undefined,
      difference: undefined,
      differencePerct: undefined
    };
  }

  const diff: Diff = {
    productionValue: productionNumber ?? undefined,
    stagingValue: stagingNumber ?? undefined,
    difference: undefined,
    differencePerct: undefined
  };

  // Track scope2 fields that make it into the final diff array
  if (fieldType?.startsWith('scope2')) {
    if (productionNumber != null || stagingNumber != null) {
      debugCounters.scope2FieldsInDiffs++;
    }
    // Track staging-only fields (AI hallucinations)
    if (productionNumber == null && stagingNumber != null) {
      debugCounters.scope2StagingOnlyFields++;
    }
  }

  if(stagingNumber && productionNumber) {
    diff.difference = Math.abs(stagingNumber - productionNumber);
    diff.differencePerct = Math.ceil((diff.difference / productionNumber) * 100) / 100;
  }

  return diff
}

async function outputEvalMetrics(companies: Company[]) {
  const outputPathCSV = resolve('output', 'accuracy', 'garbo-evaluation.csv');
  const outputPathXLSX = resolve('output', 'accuracy', 'garbo-evaluation.xlsx');
  const outputPathJSON = resolve('output', 'accuracy', 'garbo-evaluation.json');
  const csvContent = convertCompanyEvalsToCSV(companies)
  const xlsx = await generateXLSX(csvContent.split('\n'))
  const jsonObject = JSON.stringify(companies)
  await writeFile(outputPathXLSX, xlsx, 'utf8');
  await writeFile(outputPathCSV, csvContent, 'utf8');
  await writeFile(outputPathJSON, jsonObject, 'utf8');
  console.log(`✅ Statistics per report, written to ${outputPathCSV}.`);
}

// Global debugging counters
const debugCounters = {
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

type VerificationCounter = { verified: number; unverified: number; withValues: number };

function incrementVerificationCounter(counter: VerificationCounter, isVerified: boolean) {
  counter.withValues++;
  if (isVerified) {
    counter.verified++;
  } else {
    counter.unverified++;
  }
}

function incrementScope2FieldCounters(
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

function outputVerificationCounts(productionCompanies: CompanyList, reportingYear?: string) {
  const counts: Record<
    'scope1' | 'scope2' | 'scope1And2' | 'scope3' | 'statedTotal' | 'employees' | 'turnover',
    VerificationCounter
  > = {
    scope1: { verified: 0, unverified: 0, withValues: 0 },
    scope2: { verified: 0, unverified: 0, withValues: 0 },
    scope1And2: { verified: 0, unverified: 0, withValues: 0 },
    scope3: { verified: 0, unverified: 0, withValues: 0 },
    statedTotal: { verified: 0, unverified: 0, withValues: 0 },
    employees: { verified: 0, unverified: 0, withValues: 0 },
    turnover: { verified: 0, unverified: 0, withValues: 0 }
  };

  for (const company of productionCompanies) {
    for (const period of company.reportingPeriods) {
      // Filter by year if specified
      if (reportingYear) {
        const periodStartDate = typeof period.startDate === 'string' ? period.startDate : period.startDate.toString();
        if (!periodStartDate.includes(reportingYear)) continue;
      }

      // Scope1
      if (period.emissions?.scope1?.total != null) {
        incrementVerificationCounter(
          counts.scope1,
          period.emissions.scope1.metadata.verifiedBy != null
        );
      }

      // Scope2 (lb, mb, unknown)
      const scope2 = period.emissions?.scope2;
      if (scope2) {
        const scope2IsVerified = scope2.metadata.verifiedBy != null;
        incrementScope2FieldCounters(scope2.lb, scope2IsVerified, counts.scope2);
        incrementScope2FieldCounters(scope2.mb, scope2IsVerified, counts.scope2);
        incrementScope2FieldCounters(scope2.unknown, scope2IsVerified, counts.scope2);
      }

      // Scope1And2
      if (period.emissions?.scope1And2?.total != null) {
        incrementVerificationCounter(
          counts.scope1And2,
          period.emissions.scope1And2.metadata.verifiedBy != null
        );
      }

      // Scope3 categories
      if (period.emissions?.scope3?.categories) {
        for (const category of period.emissions.scope3.categories) {
          if (category.total != null) {
            incrementVerificationCounter(
              counts.scope3,
              category.metadata.verifiedBy != null
            );
          }
        }
      }

      // Stated Total Emissions
      if (period.emissions?.statedTotalEmissions?.total != null) {
        incrementVerificationCounter(
          counts.statedTotal,
          period.emissions.statedTotalEmissions.metadata.verifiedBy != null
        );
      }

      // Economy fields
      if (period.economy?.employees?.value != null) {
        incrementVerificationCounter(
          counts.employees,
          period.economy.employees.metadata.verifiedBy != null
        );
      }

      if (period.economy?.turnover?.value != null) {
        incrementVerificationCounter(
          counts.turnover,
          period.economy.turnover.metadata.verifiedBy != null
        );
      }
    }
  }

  console.log(`\n📊 Verification Counts${reportingYear ? ` for ${reportingYear}` : ' (all years)'}`);
  console.log('='.repeat(50));
  
  Object.entries(counts).forEach(([scope, count]) => {
    const total = count.verified + count.unverified;
    const verifiedPct = total > 0 ? ((count.verified / total) * 100).toFixed(1) : '0.0';
    console.log(`${scope.padEnd(12)}: ${count.withValues.toString().padStart(3)} with values | ${count.verified.toString().padStart(3)} verified (${verifiedPct}%) | ${count.unverified.toString().padStart(3)} unverified`);
  });
  console.log('='.repeat(50));
  console.log(`🔍 DEBUG: Production scope2 fields found: ${debugCounters.productionScope2Fields}`);
}

// Main function for fetching, comparison, and output
async function main() {
  try {
    const reportingYear = process.argv[2]
    const stagingData = await fetchCompanies(process.env.API_BASE_URL_STAGING); 
    const productionData = await fetchCompanies(process.env.API_BASE_URL_PROD); 
    
    // Output verification counts first
    outputVerificationCounts(productionData, reportingYear);
    
    const companies = compareCompanyLists(productionData, stagingData, reportingYear);
    
    // Debug output
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
    console.log(`🧮 CALCULATION: ${debugCounters.comparisonScope2Fields} - ${debugCounters.scope2FilteredOutUnverified} + ${debugCounters.scope2StagingOnlyFields} = ${debugCounters.comparisonScope2Fields - debugCounters.scope2FilteredOutUnverified + debugCounters.scope2StagingOnlyFields}`);
    console.log(`📉 Expected scope2 final count: ${debugCounters.comparisonScope2Fields - debugCounters.scope2FilteredOutUnverified + debugCounters.scope2StagingOnlyFields}`);
    
    if (debugCounters.missingCompanies.length > 0) {
      console.log(`\n🏢 COMPANIES MISSING FROM STAGING (with scope2 data):`);
      const totalMissingScope2Fields = debugCounters.missingCompanies.reduce((sum, company) => sum + company.scope2Fields, 0);
      console.log(`📊 Total scope2 fields in missing companies: ${totalMissingScope2Fields}`);
      console.log('='.repeat(60));
      debugCounters.missingCompanies.forEach(company => {
        console.log(`${company.name.padEnd(40)} | ${company.wikidataId} | ${company.scope2Fields} scope2 fields`);
      });
      console.log('='.repeat(60));
    }
    
    outputTotalStatistics(companies)
    outputEvalMetrics(companies);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Execute the main function
main();
 