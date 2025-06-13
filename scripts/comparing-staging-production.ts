import 'dotenv/config';
import fetch from 'node-fetch';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import * as z from 'zod';
import * as schemas from '../src/api/schemas'
import ExcelJS from 'exceljs';


// DEFINE THE ENVIRONMENTS YOU WANT TO COMPARE HERE
const STAGING_API_URL ="https://stage-api.klimatkollen.se/api";
const PRODUCTION_API_URL = "https://api.klimatkollen.se/api";

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
  differencePerct?: number;
}

interface Company {
  wikidataId: string,
  name: string;
  diffs: ComparisonDiff[];
}

interface ComparisonDiff {
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
  eval: {
    accuracy?: string;
    numbUndefinedValues?: string;
    numbNumericalDiffs?: number;
    numbOutside5PerctDiffMargin?: number;
    numbOutside20PerctDiffMargin?: number;
  }
};

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
          reportingPeriod: {
            startDate:  new Date(reportingPeriod.startDate),
            endDate: new Date(reportingPeriod.endDate)
          },
          diff: {
            scope2: {},
            scope3: [],
            economy: {}
          },
          eval: {}
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
    reportingPeriod: {
      startDate:  new Date(productionReportingPeriod.startDate),
      endDate: new Date(productionReportingPeriod.endDate)
    },
    diff: {
      scope2: {},
      scope3: [],
      economy: {}
    },
    eval: {}
  }

  const diffs: Diff[] = [];

  d.diff.scope1 = compareNumbers(
    productionReportingPeriod.emissions?.scope1?.total,
    stagingReportingPeriod.emissions?.scope1?.total,
    productionReportingPeriod.emissions?.scope1?.metadata.verifiedBy != null
  );
  diffs.push(d.diff.scope1);

  d.diff.scope2.lb = compareNumbers(
    productionReportingPeriod.emissions?.scope2?.lb,
    stagingReportingPeriod.emissions?.scope2?.lb,
    productionReportingPeriod.emissions?.scope2?.metadata.verifiedBy != null
  );
  diffs.push(d.diff.scope2.lb);

  d.diff.scope2.mb = compareNumbers(
    productionReportingPeriod.emissions?.scope2?.mb,
    stagingReportingPeriod.emissions?.scope2?.mb,
    productionReportingPeriod.emissions?.scope2?.metadata.verifiedBy != null
  );
  diffs.push(d.diff.scope2.mb);

  d.diff.scope2.unknown = compareNumbers(
    productionReportingPeriod.emissions?.scope2?.unknown,
    stagingReportingPeriod.emissions?.scope2?.unknown,
    productionReportingPeriod.emissions?.scope2?.metadata.verifiedBy != null
  );
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

  d.diff.economy.employees = compareNumbers(
    productionReportingPeriod.economy?.employees?.value,
    stagingReportingPeriod.economy?.employees?.value,
    productionReportingPeriod.economy?.employees?.metadata.verifiedBy != null
  );
  diffs.push(d.diff.economy.employees);

  d.diff.economy.turnover = compareNumbers(
    productionReportingPeriod.economy?.turnover?.value,
    stagingReportingPeriod.economy?.turnover?.value,
    productionReportingPeriod.economy?.turnover?.metadata.verifiedBy != null
  );
  diffs.push(d.diff.economy.turnover);

  // Emission-wise metrics

  const numbCorrectFields = diffs.reduce((acc: number, current: Diff) => {
    return current.productionValue === current.stagingValue ? acc+1 : acc; // this also captures if both are undefined
  }, 0);
  // How many of the values in staging are correct (i.e. matching with prod)
  d.eval.accuracy = diffs.length > 0 ? numbCorrectFields + '/' + diffs.length : undefined;
  // How many of the values in staging are undefined
  d.eval.numbUndefinedValues = diffs.reduce((acc: number, current: Diff) => {
    return current.stagingValue === undefined ? acc + 1 : acc;
  }, 0) + '/' + diffs.length;

  // How many of the fields have a numerical difference between staging and prod
    d.eval.numbNumericalDiffs = diffs.reduce((acc: number, current: Diff) => {
    return (current.differencePerct !== undefined) ? acc + 1 : acc;
  }, 0);

  d.eval.numbOutside5PerctDiffMargin = diffs.reduce((acc: number, current: Diff) => {
    return (current.differencePerct !== undefined) && (current.differencePerct > 0.05) ? acc + 1 : acc;
  }, 0);

  d.eval.numbOutside20PerctDiffMargin = diffs.reduce((acc: number, current: Diff) => {
    return (current.differencePerct !== undefined) && (current.differencePerct > 0.2) ? acc + 1 : acc;
  }, 0);

  return d;
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
  const outputPath = resolve('output', 'accuracy-results.csv');
  const outputXLSX = resolve('output', 'accuracy-results.xlsx');
  const csvContent = convertCompanyEvalsToCSV(companies)
  const xlsx = await generateXLSX(csvContent.split('\n'))
  await writeFile(outputXLSX, xlsx, 'utf8');
  await writeFile(outputPath, csvContent, 'utf8');
  console.log(`✅ Accuracy results written to ${outputPath}.`);
  const sumAccuracy = companies.reduce((acc1: number, company: Company) => {
    const sumCompanyAccuracy = company.diffs.reduce((acc2: number, diff: ComparisonDiff) => {
      const elems = diff.eval.accuracy?.split('/')
      return elems ? acc2 + (parseInt(elems[0]) / parseInt(elems[1])) : acc2
    }, 0)
    return acc1 + sumCompanyAccuracy
  }, 0)
  const totalAccuracies = companies.reduce((acc: number, company: Company) => {
    return company.diffs.length > 0 ? acc+company.diffs.length : acc;
  }, 0)
  console.log(`This is the total accuracy of all reports: ${sumAccuracy/totalAccuracies}`)
}

function convertCompanyEvalsToCSV(companies: Company[]): string {
  // Define CSV headers
  const headers = [
    'wikidataId',
    'name',
    'reportingPeriodStart',
    'reportingPeriodEnd',
    'accuracy',
    'NumbUndefinedValues',
    'NumbNumericalDiffs',
    'NumbOutside5%DiffMargin',
    'NumbOutside20%DiffMargin',
  ];

  const csvContent = headers.join(',')

  const companyRows = companies.map(company => {
    const companyReportPeriodsEval = company.diffs.map(diff => {
      return Object.values({
        wikidataId: company.wikidataId,
        name: company.name,
        reportingPeriodStart: diff.reportingPeriod.startDate.toISOString().substring(0, 10),
        reportingPeriodEnd: diff.reportingPeriod.endDate.toISOString().substring(0, 10),
        ...diff.eval
      }).join(',')
    })
    return companyReportPeriodsEval.join('\n')
  })
  return csvContent + '\n' + companyRows.join('\n')
}

async function generateXLSX(data: string[]): Promise<Buffer> {
  //console.log(data)
  if (data.length === 0) throw new Error('No data to export');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');
  const rows = data.map((row) => row.split(','));
  for(const row of rows) {
    worksheet.addRow(row);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  
  return Buffer.from(buffer);
}

// Main function for fetching, comparison, and output
async function main() {
  try {
    const stagingData = await fetchCompanies(STAGING_API_URL); 
    const productionData = await fetchCompanies(PRODUCTION_API_URL); 
    const companies = compareCompanyLists(productionData, stagingData);
    outputEvalMetrics(companies);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Execute the main function
main();
 