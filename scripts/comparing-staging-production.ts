import 'dotenv/config';
import fetch from 'node-fetch';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import * as z from 'zod';
import * as schemas from '../src/api/schemas'

type CompanyList = z.infer<typeof schemas.CompanyList>;
type ReportingPeriod  = z.infer<typeof schemas.MinimalReportingPeriodSchema>;
type Company = z.infer<typeof schemas.MinimalCompanyBase>;
const NUMBER_OF_CATEGORIES = 16;
const ONLY_CHECK_VERIFIED_DATA = true;
const IGNORE_REPORTING_PERIODS_NOT_IN_STAGING = true;

interface Diff {
  productionValue?: number;
  stagingValue?: number;
  difference?: number;
}

interface ComparisonDiff {
  wikidataId: string;
  name: string;
  reportingPeriod: {
    startDate: Date;
    endDate: Date;
  },
  diff: {
    scope1?: Diff;
    scope2: {
      lb?: Diff;
      mb?: Diff;
      unknown?: Diff;
    }
    scope3:
      {
        categoryId: number;
        value?: Diff;
      }[],
    economy: {
      employees?: Diff,
      turnover?: Diff
    }
  },
  accuracy?: number;
};

// Define URLs from environment variables
const STAGING_API_URL ="http://localhost:3000/api";

const PRODUCTION_API_URL = "https://api.klimatkollen.se/api";

// Parse the API tokens assuming they are in the environment variables
const API_TOKENS = process.env.API_TOKENS;
if (!API_TOKENS) {
  throw new Error('API_TOKENS environment variable is not defined');
}
const tokens = API_TOKENS.split(',').reduce((acc, token) => {
  const [name, value] = token.split(':');
  acc[name] = value;
  return acc;
}, {} as Record<string, string>);

// Function to fetch companies from a given API URL
async function fetchCompanies(baseURL: string) {
  const response = await fetch(`${baseURL}/companies`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${tokens['garbo']}`, // Use the appropriate token
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch data from ${baseURL}: ${response.statusText}`);
  }
  const data = await response.json();
  return data;
}

// Function to compare data between staging and production
function compareCompanyLists(productionCompanies: CompanyList, stagingCompanies: CompanyList): ComparisonDiff[] {
  const diffs: ComparisonDiff[] = [];

  for(const productionCompany of productionCompanies) {
    const stagingCompany = stagingCompanies.find((companyI) => companyI.wikidataId === productionCompany.wikidataId);
    for(const reportingPeriod of productionCompany.reportingPeriods) {
      const stagingReportingPeriod = stagingCompany?.reportingPeriods.find((periodI) => periodI.startDate === reportingPeriod.startDate && periodI.endDate === reportingPeriod.endDate) ?? undefined;
      if(productionCompany.wikidataId === "Q47508289") {
        console.log(stagingCompany);
      }
      if(stagingReportingPeriod) {
        diffs.push(compareReportingPeriods(reportingPeriod, stagingReportingPeriod, productionCompany));
      } else {
        if(IGNORE_REPORTING_PERIODS_NOT_IN_STAGING) {
          continue;
        }
        const notFoundDiff: ComparisonDiff = {
          wikidataId: productionCompany.wikidataId,
          name: productionCompany.name,
          reportingPeriod: {
            startDate:  new Date(reportingPeriod.startDate),
            endDate: new Date(reportingPeriod.endDate)
          },
          diff: {
            scope2: {},
            scope3: [],
            economy: {}
          },
          accuracy: 0
        }      
        diffs.push(notFoundDiff);
      }
    }
  }

  return diffs; 
}


function compareReportingPeriods(productionReportingPeriod: ReportingPeriod, stagingReportingPeriod: ReportingPeriod, productionCompany: Company) {
  const d: ComparisonDiff = {
    wikidataId: productionCompany.wikidataId,
    name: productionCompany.name,
    reportingPeriod: {
      startDate:  new Date(productionReportingPeriod.startDate),
      endDate: new Date(productionReportingPeriod.endDate)
    },
    diff: {
      scope2: {},
      scope3: [],
      economy: {}
    },
    accuracy: 0
  }

  const diffs: Diff[] = [];

  d.diff.scope1 = compareNumbers(productionReportingPeriod.emissions?.scope1?.total, stagingReportingPeriod.emissions?.scope1?.total, productionReportingPeriod.emissions?.scope1?.metadata.verifiedBy != null);
  diffs.push(d.diff.scope1);
  d.diff.scope2.lb = compareNumbers(productionReportingPeriod.emissions?.scope2?.lb, stagingReportingPeriod.emissions?.scope2?.lb, productionReportingPeriod.emissions?.scope2?.metadata.verifiedBy != null);
  diffs.push(d.diff.scope2.lb);
  d.diff.scope2.mb = compareNumbers(productionReportingPeriod.emissions?.scope2?.lb, stagingReportingPeriod.emissions?.scope2?.lb, productionReportingPeriod.emissions?.scope2?.metadata.verifiedBy != null);
  diffs.push(d.diff.scope2.mb);
  d.diff.scope2.unknown = compareNumbers(productionReportingPeriod.emissions?.scope2?.unknown, stagingReportingPeriod.emissions?.scope2?.unknown, productionReportingPeriod.emissions?.scope2?.metadata.verifiedBy != null);
  diffs.push(d.diff.scope2.unknown);

  for(let i = 0; i < NUMBER_OF_CATEGORIES; i++) {
    const productionCategory = productionReportingPeriod.emissions?.scope3?.categories.find((categoryI) => categoryI.category === i) ?? undefined;
    const stagingCategory = stagingReportingPeriod.emissions?.scope3?.categories.find((categoryI) => categoryI.category === i) ?? undefined;   
    const diff = compareNumbers(productionCategory?.total, stagingCategory?.total, productionCategory?.metadata.verifiedBy != null); 
    diffs.push(diff)
    d.diff.scope3.push({
      categoryId: i,
      value: diff
    })
  }

  d.diff.economy.employees = compareNumbers(productionReportingPeriod.economy?.employees?.value, stagingReportingPeriod.economy?.employees?.value, productionReportingPeriod.economy?.employees?.metadata.verifiedBy != null);
  diffs.push(d.diff.economy.employees);
  d.diff.economy.turnover = compareNumbers(productionReportingPeriod.economy?.turnover?.value, stagingReportingPeriod.economy?.turnover?.value, productionReportingPeriod.economy?.turnover?.metadata.verifiedBy != null);
  diffs.push(d.diff.economy.turnover);

  const numbersSum = diffs.reduce((acc: number, current: Diff) => {
    return current.difference !== undefined ? acc + (calculateDiffPercentage(current.difference, current.productionValue) ?? 0) : acc;
  }, 0);
  const numbersCount = diffs.reduce((acc: number, current: Diff) => {
    return current.difference !== undefined ? acc + 1 : acc;
  }, 0);
  if(numbersCount > 0) {
    d.accuracy = parseFloat((numbersSum / numbersCount).toFixed(3));
  } else {
    d.accuracy = undefined;
  }
  return d;
}

function compareNumbers(productionNumber: number | undefined | null, stagingNumber: number | undefined | null, productionVerified?: boolean): Diff {
  const diff: Diff = {
    productionValue: productionNumber ?? undefined,
    stagingValue: stagingNumber ?? undefined,
  };
  if(ONLY_CHECK_VERIFIED_DATA && !productionVerified) {
    diff.difference = undefined;
    return diff;
  }
  if(stagingNumber) {
    if(productionNumber) {
      diff.difference = stagingNumber - productionNumber;
      return diff;
    } else {
      diff.difference = undefined;
      return diff;
    }
  } else {    
    diff.difference = productionNumber ? 0 : undefined;
    return diff;
  }  
}

function calculateDiffPercentage(diff?: number, compareValue?: number) {
  if(diff === undefined || compareValue === undefined) {
    return undefined;
  }
  return Math.ceil((1 - (Math.abs(diff) / compareValue)) * 100) / 100;
}

// Function to output results to a file
async function outputResults(results: ComparisonDiff[]) {
  const outputPath = resolve('output', 'accuracy-results.csv');
  await writeFile(outputPath, convertDiffsToCSV(results), 'utf8');
  console.log(`✅ Accuracy results written to ${outputPath}.`);
}



// Main function for fetching, comparison, and output
async function main() {
  try {
    const stagingData = await fetchCompanies(STAGING_API_URL); 
    const productionData = await fetchCompanies(PRODUCTION_API_URL); 
    const diffs = compareCompanyLists(productionData, stagingData);
    outputResults(diffs);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

export function convertDiffsToCSV(data: ComparisonDiff[]): string {
  // Define CSV headers
  const headers = [
    'wikidataId',
    'name',
    'reportingPeriodStart',
    'reportingPeriodEnd',
    'accuracy',    
  ];

  const valueHeaders = [
    'Scope1',
    'Scope2_lb',
    'Scope2_mb',
    'Scope2_unknown',
    'EconomyEmployees',
    'EconomyTurnover',
    'Scope3_purchasedGoods',
    'Scope3_capitalGoods',
    'Scope3_fuelAndEnergyRelatedActivities',
    'Scope3_upstreamTransportationAndDistribution',
    'Scope3_wasteGeneratedInOperations',
    'Scope3_businessTravel',
    'Scope3_employeeCommuting',
    'Scope3_upstreamLeasedAssets',
    'Scope3_downstreamTransportationAndDistribution',
    'Scope3_processingOfSoldProducts',
    'Scope3_useOfSoldProducts',
    'Scope3_endOfLifeTreatmentOfSoldProducts',
    'Scope3_downstreamLeasedAssets',
    'Scope3_franchises',
    'Scope3_investments',
    'Scope3_other',
  ];

  const valueSubheaders = [
    'production',
    'staging',
    'difference',
    'diff %'
  ]

  // Create CSV content with headers
  let csvContent = headers.join(',') + ',' + valueHeaders.reduce((acc: string[], current) => {
    for(const valueSubheader of valueSubheaders) {
      acc.push(current + " " + valueSubheader);
    }
    return acc;
  },[]).join(',') + '\n';

  // Add data rows
  data.forEach(item => {
    const reportingPeriodStart = item.reportingPeriod.startDate 
      ? item.reportingPeriod.startDate.toISOString().substring(0, 10)
      : '';
    
    const reportingPeriodEnd = item.reportingPeriod.endDate
      ? item.reportingPeriod.endDate.toISOString().substring(0, 10)
      : '';

    const row = [
      item.wikidataId,
      `"${item.name.replace(/"/g, '""')}"`, // Escape quotes in name
      reportingPeriodStart,
      reportingPeriodEnd,
      item.accuracy?.toString() ?? '',
      convertDiffToCSV(item.diff.scope1),
      convertDiffToCSV(item.diff.scope2.lb),
      convertDiffToCSV(item.diff.scope2.mb),
      convertDiffToCSV(item.diff.scope2.unknown),
      convertDiffToCSV(item.diff.economy.employees),
      convertDiffToCSV(item.diff.economy.turnover)
    ];

    for(let i = 0; i < NUMBER_OF_CATEGORIES; i++) {
      const category = item.diff.scope3.find(categoryI => categoryI.categoryId === i);
      row.push(convertDiffToCSV(category?.value));
    }

    csvContent += row.join(',') + '\n';
  });

  return csvContent;
}

function convertDiffToCSV(data?: Diff): string {
  if(!data) {
    return ['', '', '', ''].join(',');
  }
  return [data.productionValue ?? '', data.stagingValue ?? '', data.difference ?? '', calculateDiffPercentage(data.difference, data.productionValue) ?? ''].join(',');
}

// Execute the main function
main();
 