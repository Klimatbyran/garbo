import 'dotenv/config';
import fetch from 'node-fetch';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import * as z from 'zod';
import * as schemas from '../src/api/schemas'

type CompanyList = z.infer<typeof schemas.CompanyList>;
type ReportingPeriod  = z.infer<typeof schemas.MinimalReportingPeriodSchema>;
type CompanyResponse = z.infer<typeof schemas.MinimalCompanyBase>;
const NUMBER_OF_CATEGORIES = 16;
const ONLY_CHECK_VERIFIED_DATA = true;
const IGNORE_REPORTING_PERIODS_NOT_IN_STAGING = true;

interface Diff {
  productionValue?: number;
  stagingValue?: number;
  difference?: number;
  perctDifference?: number;
}

interface Company {
  wikidataId: string,
  name: string;
  diffs: ComparisonDiff[];
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
  numberOfFields?: number;
  numberIncorrect?: number;
  numberBelow90Acc?: number;
  numberBelow95Acc?:number;
};

// Define URLs from environment variables
const STAGING_API_URL ="https://stage-api.klimatkollen.se/api";

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
function compareCompanyLists(productionCompanies: CompanyList, stagingCompanies: CompanyList): Company[] {
  const companies: Company[] = [];

  for(const productionCompany of productionCompanies) {
    const stagingCompany = stagingCompanies.find((companyI) => companyI.wikidataId === productionCompany.wikidataId);
    for(const reportingPeriod of productionCompany.reportingPeriods) {
      const stagingReportingPeriod = stagingCompany?.reportingPeriods.find((periodI) => periodI.startDate === reportingPeriod.startDate && periodI.endDate === reportingPeriod.endDate) ?? undefined;
      if(stagingReportingPeriod) {
        const diff = compareReportingPeriods(reportingPeriod, stagingReportingPeriod, productionCompany);
        const existingCompany = companies.find((companyI) => companyI.wikidataId === productionCompany.wikidataId);
        if(existingCompany) {
          existingCompany.diffs.push(diff);
        } else {
          const company: Company = {
            name: productionCompany.name,
            wikidataId: productionCompany.wikidataId,
            diffs: []
          }
          company.diffs.push(diff);
          companies.push(company);
        }
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
        const existingCompany = companies.find((companyI) => companyI.wikidataId === productionCompany.wikidataId);
        if(existingCompany) {
          existingCompany.diffs.push(notFoundDiff);
        } else {
          const company: Company = {
            name: productionCompany.name,
            wikidataId: productionCompany.wikidataId,
            diffs: []
          }
          company.diffs.push(notFoundDiff);
          companies.push(company);
        }
      }
    }
  }

  return companies; 
}


function compareReportingPeriods(productionReportingPeriod: ReportingPeriod, stagingReportingPeriod: ReportingPeriod, productionCompany: CompanyResponse) {
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
    accuracy: 0,
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

  for(let i = 1; i <= NUMBER_OF_CATEGORIES; i++) {
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
    return current.difference !== undefined ? acc + (current.perctDifference ?? 0) : acc;
  }, 0);
  const numbersCount = diffs.reduce((acc: number, current: Diff) => {
    return current.difference !== undefined ? acc + 1 : acc;
  }, 0);
  const numberIncorrect = diffs.reduce((acc: number, current: Diff) => {
    return current.difference !== undefined ? current.difference !== 0 ? acc + 1 : acc: acc;
  }, 0);
  const below90 = diffs.reduce((acc: number, current: Diff) => {
    return current.perctDifference ? current.perctDifference < 0.9 ? acc + 1 : acc : acc;
  }, 0);
  const below95 = diffs.reduce((acc: number, current: Diff) => {
    return current.perctDifference ? current.perctDifference < 0.95 ? acc + 1 : acc : acc;
  }, 0);
  d.numberBelow90Acc = diffs.length > 0 ? below90 / diffs.length: undefined;
  d.numberBelow95Acc = diffs.length > 0 ? below95 / diffs.length: undefined;
  d.numberIncorrect = numberIncorrect;
  d.numberOfFields = numbersCount;
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
      diff.perctDifference = calculateDiffPercentage(diff.difference, productionNumber, stagingNumber);
      return diff;
    } else {
      diff.difference = undefined;
      return diff;
    }
  } else {    
    diff.difference = productionNumber ? 0 : undefined;
    diff.perctDifference = productionNumber ? 1 : undefined;
    return diff;
  }  
}

function calculateDiffPercentage(diff?: number, compareValueProd?: number, compareValueStaging?: number) {
  if(diff === undefined || compareValueProd === undefined) {
    return undefined;
  }
  return Math.ceil((1 - (Math.abs(diff) / Math.max(compareValueProd, compareValueStaging || 0))) * 100) / 100;
}

// Function to output results to a file
async function outputResults(results: Company[]) {
  const outputPath = resolve('output', 'accuracy-results.csv');
  await writeFile(outputPath, convertDiffsToCSV(results), 'utf8');
  console.log(`✅ Accuracy results written to ${outputPath}.`);
}

async function outputCompanyResults(results: Company[]) {
  const outputPath = resolve('output', 'accuracy-results-companies.csv');
  await writeFile(outputPath, getCompanieStatistics(results), 'utf8');
  console.log(`✅ Accuracy results written to ${outputPath}.`);
}

// Main function for fetching, comparison, and output
async function main() {
  try {
    const stagingData = await fetchCompanies(STAGING_API_URL); 
    const productionData = await fetchCompanies(PRODUCTION_API_URL); 
    const diffs = compareCompanyLists(productionData, stagingData);
    outputResults(diffs);
    outputCompanyResults(diffs);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

export function convertDiffsToCSV(data: Company[]): string {
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

  const errorHeader = [
    'Below_90',
    'Below_95',
  ]

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
  },[]).join(',') + ',' + errorHeader.join(',') + '\n';

  // Add data rows
  data.map((company) => {
    company.diffs.forEach(item => {
      const reportingPeriodStart = item.reportingPeriod.startDate 
        ? item.reportingPeriod.startDate.toISOString().substring(0, 10)
        : '';
      
      const reportingPeriodEnd = item.reportingPeriod.endDate
        ? item.reportingPeriod.endDate.toISOString().substring(0, 10)
        : '';
  
      const row = [
        company.wikidataId,
        `"${company.name.replace(/"/g, '""')}"`, // Escape quotes in name
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
  
      for(let i = 1; i <= NUMBER_OF_CATEGORIES; i++) {
        const category = item.diff.scope3.find(categoryI => categoryI.categoryId === i);
        row.push(convertDiffToCSV(category?.value));
      }
  
      row.push(item.numberBelow90Acc?.toString() ?? '');
      row.push(item.numberBelow95Acc?.toString() ?? '');
  
      csvContent += row.join(',') + '\n';
    });
  })  

  return csvContent;
}

function getCompanieStatistics(companies: Company[]): string {
  const headers = [
    "ID",
    "Name",
    "Reporting Periods",
    "Number of Errors",
    "Relative Number of Errors",
    "Faulty Reportingperiods",
    "Relative Number of Faulty Reportingperiods",
    "Below 95%",
    "Below 90%",
    "Number of Fields",
    "Faults Scope 1",
    "Faults Scope 2",
    "Faults Scope 3",
    "Faults Economy",
    "Faults Last Reportingperiod",
    "Fields Last Reportingperiod",
    "Overall Accuracy",
    "Fields Scope 1",
    "Fields Scope 2",
    "Fields Scope 3",
    "Fields Econonmy"
  ];

  const values: string[] = [];

  for(const company of companies) {
    const overallNumberOfErrors = company.diffs.reduce((acc, value) => acc += value.numberIncorrect || 0, 0);
    const overallNumberOfFields = company.diffs.reduce((acc, value) => acc += value.numberOfFields || 0, 0);
    const faultyReportingPeriods = company.diffs.reduce((acc, value) => value.numberIncorrect !== undefined && value.numberIncorrect > 0 ? acc + 1 : acc , 0);
    const numberOfCompareableReportingPeriods = company.diffs.reduce((acc, value) => value.numberOfFields !== undefined && value.numberOfFields > 0 ? acc + 1 : acc , 0);
    const overall95 = company.diffs.length ? company.diffs.reduce((acc, value) => acc += value.numberBelow95Acc || 0 , 0) / company.diffs.length : 0;
    const overall90 = company.diffs.length ? company.diffs.reduce((acc, value) => acc += value.numberBelow90Acc || 0 , 0) / company.diffs.length: 0;
    const overallAccuracy = company.diffs.length ? company.diffs.reduce((acc, value) => acc += value.accuracy || 0 , 0) / company.diffs.length: 0;
    const overallFaultsScope1 = company.diffs.reduce((acc, value) => value.diff.scope1?.difference !== undefined && value.diff.scope1.difference !== 0 ? acc + 1 : acc , 0);
    const overallScope1Fields = company.diffs.reduce((acc, value) => value.diff.scope1?.difference !== undefined ? acc + 1 : acc , 0);
    const overallFaultsScope2 = company.diffs.reduce((acc, value) =>  {
      acc += value.diff.scope2.lb?.difference !== undefined && value.diff.scope2.lb.difference !== 0 ? 1 : 0;
      acc += value.diff.scope2.mb?.difference !== undefined && value.diff.scope2.mb.difference !== 0 ? 1 : 0;
      acc += value.diff.scope2.unknown?.difference !== undefined && value.diff.scope2.unknown.difference !== 0 ? 1 : 0;
      return acc;    
    }, 0);
    const overallScope2Fields = company.diffs.reduce((acc, value) =>  {
      acc += value.diff.scope2.lb?.difference !== undefined ? 1 : 0;
      acc += value.diff.scope2.mb?.difference !== undefined ? 1 : 0;
      acc += value.diff.scope2.unknown?.difference !== undefined ? 1 : 0;
      return acc;    
    }, 0);
    const overallFaultsScope3 = company.diffs.reduce((acc, value) => {
      for(const category of value.diff.scope3) {
        acc += category.value?.difference !== undefined && category.value.difference !== 0 ? 1 : 0;
      }
      return acc;
    }, 0);
    const overallScope3Fields = company.diffs.reduce((acc, value) => {
      for(const category of value.diff.scope3) {
        acc += category.value?.difference !== undefined ? 1 : 0;
      }
      return acc;
    }, 0);
    const overallFaultsEconomy = company.diffs.reduce((acc, value) => {
      acc += value.diff.economy.employees?.difference !== undefined && value.diff.economy.employees.difference !== 0 ? 1 : 0;
      acc += value.diff.economy.turnover?.difference !== undefined && value.diff.economy.turnover.difference !== 0 ? 1 : 0;
      return acc;    
    }, 0);
    const overallEconomyFields = company.diffs.reduce((acc, value) => {
      acc += value.diff.economy.employees?.difference !== undefined ? 1 : 0;
      acc += value.diff.economy.turnover?.difference !== undefined ? 1 : 0;
      return acc;    
    }, 0);
    const mostRecentReportingPeriod = company.diffs.sort((a,b) => (new Date(b.reportingPeriod.endDate)).getTime() - (new Date(a.reportingPeriod.endDate)).getTime())[0]

    values.push([company.wikidataId, company.name, numberOfCompareableReportingPeriods, overallNumberOfErrors, overallNumberOfFields ? overallNumberOfErrors / overallNumberOfFields : 0,
      faultyReportingPeriods, numberOfCompareableReportingPeriods ? faultyReportingPeriods / numberOfCompareableReportingPeriods : 0, overall95, overall90, overallNumberOfFields,
      overallFaultsScope1, overallFaultsScope2, overallFaultsScope3, overallFaultsEconomy, mostRecentReportingPeriod.numberIncorrect, mostRecentReportingPeriod.numberOfFields, overallAccuracy,
      overallScope1Fields, overallScope2Fields, overallScope3Fields, overallEconomyFields].join(","));
  }

  return headers.join(",") + "\n" + values.join("\n");
}

function convertDiffToCSV(data?: Diff): string {
  if(!data) {
    return ['', '', '', ''].join(',');
  }
  return [data.productionValue ?? '', data.stagingValue ?? '', data.difference ?? '', calculateDiffPercentage(data.difference, data.productionValue, data.stagingValue) ?? ''].join(',');
}

// Execute the main function
main();
 