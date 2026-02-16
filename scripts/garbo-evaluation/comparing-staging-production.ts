import 'dotenv/config';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import * as z from 'zod';
import * as schemas from '../../src/api/schemas';
import { fetchCompanies } from './utils/fetchUtils';
import { convertCompanyEvalsToCSV, generateXLSX } from './utils/outputFunctions';
import { reportStatistics, outputTotalStatistics } from './utils/statisticsFunctions';
import {
  debugCounters,
  outputVerificationCounts as debugOutputVerificationCounts,
  logDebugCounters
} from './comparing-staging-production-debug-helpers';

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
function compareCompanyLists(
  productionCompanies: CompanyList,
  stagingCompanies: CompanyList,
  reportingYear?: string
): Company[] {
  const companies: Company[] = [];

  for (const productionCompany of productionCompanies) {
    const stagingCompany = stagingCompanies.find(
      companyCandidate => companyCandidate.wikidataId === productionCompany.wikidataId
    );

    if (stagingCompany) {
      handleCompanyWithStagingMatch({
        productionCompany,
        stagingCompany,
        reportingYear,
        companies
      });
    } else {
      handleCompanyMissingInStaging(productionCompany, reportingYear);
    }
  }

  return companies;
}

function handleCompanyWithStagingMatch(params: {
  productionCompany: CompanyResponse;
  stagingCompany: CompanyResponse;
  reportingYear?: string;
  companies: Company[];
}) {
  const { productionCompany, stagingCompany, reportingYear, companies } = params;

  debugCounters.companiesProcessed++;

  const companyDiffTarget: Company = {
    name: productionCompany.name,
    wikidataId: productionCompany.wikidataId,
    diffReports: []
  };
  companies.push(companyDiffTarget);

  if (reportingYear) {
    addDiffForSingleReportingYear({
      productionCompany,
      stagingCompany,
      reportingYear,
      companyDiffTarget
    });
  } else {
    addDiffForAllReportingPeriods({
      productionCompany,
      stagingCompany,
      companyDiffTarget
    });
  }
}

function addDiffForSingleReportingYear(params: {
  productionCompany: CompanyResponse;
  stagingCompany: CompanyResponse;
  reportingYear: string;
  companyDiffTarget: Company;
}) {
  const { productionCompany, stagingCompany, reportingYear, companyDiffTarget } = params;

  const productionReportingPeriod = productionCompany.reportingPeriods.find(period => {
    const periodStartDate =
      typeof period.startDate === 'string'
        ? period.startDate
        : period.startDate.toString();
    return periodStartDate.includes(reportingYear);
  });

  const stagingReportingPeriod = productionReportingPeriod
    ? stagingCompany.reportingPeriods.find(
        candidatePeriod =>
          candidatePeriod.startDate === productionReportingPeriod.startDate &&
          candidatePeriod.endDate === productionReportingPeriod.endDate
      )
    : undefined;

  if (stagingReportingPeriod && productionReportingPeriod) {
    debugCounters.periodsProcessed++;
    const diffReport = compareReportingPeriods(
      productionReportingPeriod,
      stagingReportingPeriod,
      productionCompany
    );
    companyDiffTarget.diffReports.push(diffReport);
  } else if (productionReportingPeriod) {
    debugCounters.filteredOutNoStagingData++;
  }
}

function addDiffForAllReportingPeriods(params: {
  productionCompany: CompanyResponse;
  stagingCompany: CompanyResponse;
  companyDiffTarget: Company;
}) {
  const { productionCompany, stagingCompany, companyDiffTarget } = params;

  for (const productionReportingPeriod of productionCompany.reportingPeriods) {
    const stagingReportingPeriod = stagingCompany.reportingPeriods.find(
      candidatePeriod =>
        candidatePeriod.startDate === productionReportingPeriod.startDate &&
        candidatePeriod.endDate === productionReportingPeriod.endDate
    );

    if (stagingReportingPeriod) {
      debugCounters.periodsProcessed++;
      const diffReport = compareReportingPeriods(
        productionReportingPeriod,
        stagingReportingPeriod,
        productionCompany
      );
      companyDiffTarget.diffReports.push(diffReport);
    } else {
      debugCounters.filteredOutNoStagingData++;
    }
  }
}

function handleCompanyMissingInStaging(
  productionCompany: CompanyResponse,
  reportingYear?: string
) {
  debugCounters.filteredOutNoStagingCompany++;

  const scope2FieldsInMissingCompany = countScope2FieldsForMissingCompany(
    productionCompany,
    reportingYear
  );

  if (scope2FieldsInMissingCompany === 0) {
    return;
  }

  debugCounters.missingCompanies.push({
    wikidataId: productionCompany.wikidataId,
    name: productionCompany.name,
    scope2Fields: scope2FieldsInMissingCompany
  });
}

function countScope2FieldsForMissingCompany(
  productionCompany: CompanyResponse,
  reportingYear?: string
): number {
  let scope2FieldsInMissingCompany = 0;

  for (const period of productionCompany.reportingPeriods) {
    if (reportingYear && !reportingPeriodMatchesYear(period, reportingYear)) {
      continue;
    }

    const scope2 = period.emissions?.scope2;
    if (scope2?.lb != null) scope2FieldsInMissingCompany++;
    if (scope2?.mb != null) scope2FieldsInMissingCompany++;
    if (scope2?.unknown != null) scope2FieldsInMissingCompany++;
  }

  return scope2FieldsInMissingCompany;
}

function reportingPeriodMatchesYear(
  reportingPeriod: ReportingPeriod,
  reportingYear: string
): boolean {
  const periodStartDate =
    typeof reportingPeriod.startDate === 'string'
      ? reportingPeriod.startDate
      : reportingPeriod.startDate.toString();

  return periodStartDate.includes(reportingYear);
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
  const csvContent = convertCompanyEvalsToCSV(companies);
  const xlsx = await generateXLSX(csvContent.split('\n'));
  const jsonObject = JSON.stringify(companies);
  await writeFile(outputPathXLSX, xlsx, 'utf8');
  await writeFile(outputPathCSV, csvContent, 'utf8');
  await writeFile(outputPathJSON, jsonObject, 'utf8');
  console.log(`✅ Statistics per report, written to ${outputPathCSV}.`);
}

// Main function for fetching, comparison, and output
async function main() {
  try {
    const reportingYear = process.argv[2]
    const stagingData = await fetchCompanies(process.env.API_BASE_URL_STAGING); 
    const productionData = await fetchCompanies(process.env.API_BASE_URL_PROD); 
    
    // Output verification counts first (debug helper)
    debugOutputVerificationCounts(productionData, reportingYear);
    
    const companies = compareCompanyLists(productionData, stagingData, reportingYear);

    logDebugCounters();
    
    outputTotalStatistics(companies)
    outputEvalMetrics(companies);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Execute the main function
main();
 