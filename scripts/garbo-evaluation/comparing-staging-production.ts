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
      scope3StatedTotalEmissions?: Diff;
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
      companies.push({
        name: productionCompany.name,
        wikidataId: productionCompany.wikidataId,
        diffReports: []
      })
      if (reportingYear) {
        const prodReportingPeriod = productionCompany?.reportingPeriods.find((period) => typeof period.startDate === 'string' ? period.startDate.includes(reportingYear) : period.startDate.toString().includes(reportingYear))
        const stagingReportingPeriod = prodReportingPeriod ? stagingCompany?.reportingPeriods.find((periodI) => periodI.startDate === prodReportingPeriod.startDate && periodI.endDate === prodReportingPeriod.endDate) : undefined;
        if(stagingReportingPeriod && prodReportingPeriod) {
          const diffReport = compareReportingPeriods(prodReportingPeriod, stagingReportingPeriod, productionCompany);
          const existingCompany = companies.find((companyI) => companyI.wikidataId === productionCompany.wikidataId);
          existingCompany?.diffReports.push(diffReport);
        }
      }
      else {
        for(const reportingPeriod of productionCompany.reportingPeriods) {
          const stagingReportingPeriod = stagingCompany?.reportingPeriods.find((periodI) => periodI.startDate === reportingPeriod.startDate && periodI.endDate === reportingPeriod.endDate);
          if(stagingReportingPeriod) {
            const diffReport = compareReportingPeriods(reportingPeriod, stagingReportingPeriod, productionCompany);
            const existingCompany = companies.find((companyI) => companyI.wikidataId === productionCompany.wikidataId);
            existingCompany?.diffReports.push(diffReport);
          }
        }
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
    productionReportingPeriod.emissions?.scope2?.metadata.verifiedBy != null
  );
  diffs.push(diffReport.diffs.emissions.scope2.lb);

  diffReport.diffs.emissions.scope2.mb = compareNumbers(
    productionReportingPeriod.emissions?.scope2?.mb,
    stagingReportingPeriod.emissions?.scope2?.mb,
    productionReportingPeriod.emissions?.scope2?.metadata.verifiedBy != null
  );
  diffs.push(diffReport.diffs.emissions.scope2.mb);

  diffReport.diffs.emissions.scope2.unknown  = compareNumbers(
    productionReportingPeriod.emissions?.scope2?.unknown,
    stagingReportingPeriod.emissions?.scope2?.unknown,
    productionReportingPeriod.emissions?.scope2?.metadata.verifiedBy != null
  );
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

  // Scope 3 stated total emissions
  diffReport.diffs.emissions.scope3StatedTotalEmissions = compareNumbers(
    productionReportingPeriod.emissions?.scope3?.statedTotalEmissions?.total,
    stagingReportingPeriod.emissions?.scope3?.statedTotalEmissions?.total,
    productionReportingPeriod.emissions?.scope3?.statedTotalEmissions?.metadata.verifiedBy != null
  );
  diffs.push(diffReport.diffs.emissions.scope3StatedTotalEmissions);

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

function compareNumbers(productionNumber: number | undefined | null, stagingNumber: number | undefined | null, productionVerified?: boolean): Diff {
  const diff: Diff = {
    productionValue: productionNumber ?? undefined,
    stagingValue: stagingNumber ?? undefined,
    difference: undefined,
    differencePerct: undefined
  };
  if(ONLY_CHECK_VERIFIED_DATA && !productionVerified) {
    diff.difference = undefined;
    diff.differencePerct = undefined;
  }
  else if(stagingNumber && productionNumber) {
    diff.difference = Math.abs(stagingNumber - productionNumber);
    diff.differencePerct = Math.ceil((diff.difference / productionNumber) * 100) / 100;
  }

  return diff
}

async function outputEvalMetrics(companies: Company[]) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPathCSV = resolve('output', 'accuracy', `garbo-evaluation-${timestamp}.csv`);
  const outputPathXLSX = resolve('output', 'accuracy', `garbo-evaluation-${timestamp}.xlsx`);
  const outputPathJSON = resolve('output', 'accuracy', `garbo-evaluation-${timestamp}.json`);
  const csvContent = convertCompanyEvalsToCSV(companies)
  const xlsx = await generateXLSX(csvContent.split('\n'))
  const jsonObject = JSON.stringify(companies)
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
    const companies = compareCompanyLists(productionData, stagingData, reportingYear);
    outputTotalStatistics(companies)
    outputEvalMetrics(companies);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Execute the main function
main();
 