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
  diffs: DiffReport[];
}

interface DiffReport {
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
    accuracy?: {description?: string, value?: number};
    accuracyNumericalFields?: {description?: string, value?: number};
    magnError?: number;
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
        const notFoundDiff: DiffReport = {
          reportingPeriod: {
            startDate:  new Date(reportingPeriod.startDate),
            endDate: new Date(reportingPeriod.endDate)
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
  const d: DiffReport = {
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

  d.diffs.emissions.scope1  = compareNumbers(
    productionReportingPeriod.emissions?.scope1?.total,
    stagingReportingPeriod.emissions?.scope1?.total,
    productionReportingPeriod.emissions?.scope1?.metadata.verifiedBy != null
  );
  diffs.push(d.diffs.emissions.scope1);

  d.diffs.emissions.scope2.lb = compareNumbers(
    productionReportingPeriod.emissions?.scope2?.lb,
    stagingReportingPeriod.emissions?.scope2?.lb,
    productionReportingPeriod.emissions?.scope2?.metadata.verifiedBy != null
  );
  diffs.push(d.diffs.emissions.scope2.lb);


  d.diffs.emissions.scope2.mb = compareNumbers(
    productionReportingPeriod.emissions?.scope2?.mb,
    stagingReportingPeriod.emissions?.scope2?.mb,
    productionReportingPeriod.emissions?.scope2?.metadata.verifiedBy != null
  );
  diffs.push(d.diffs.emissions.scope2.mb);

  d.diffs.emissions.scope2.unknown  = compareNumbers(
    productionReportingPeriod.emissions?.scope2?.unknown,
    stagingReportingPeriod.emissions?.scope2?.unknown,
    productionReportingPeriod.emissions?.scope2?.metadata.verifiedBy != null
  );
  diffs.push(d.diffs.emissions.scope2.unknown);

  d.diffs.emissions.scope1And2 = compareNumbers(
    productionReportingPeriod.emissions?.scope1And2?.total,
    stagingReportingPeriod.emissions?.scope1And2?.total,
    productionReportingPeriod.emissions?.scope1And2?.metadata.verifiedBy != null
  );
  diffs.push(d.diffs.emissions.scope1And2);

  d.diffs.emissions.statedTotalEmissions = compareNumbers(
    productionReportingPeriod.emissions?.statedTotalEmissions?.total,
    stagingReportingPeriod.emissions?.statedTotalEmissions?.total,
    productionReportingPeriod.emissions?.statedTotalEmissions?.metadata.verifiedBy != null
  );
  diffs.push(d.diffs.emissions.statedTotalEmissions);

  for(let i = 1; i <= NUMBER_OF_CATEGORIES; i++) {
    const productionCategory = productionReportingPeriod.emissions?.scope3?.categories.find((categoryI) => categoryI.category === i) ?? undefined;
    const stagingCategory = stagingReportingPeriod.emissions?.scope3?.categories.find((categoryI) => categoryI.category === i) ?? undefined;   
    const diff = compareNumbers(productionCategory?.total, stagingCategory?.total, productionCategory?.metadata.verifiedBy != null); 
    diffs.push(diff)
    d.diffs.emissions.scope3.push({
      categoryId: i,
      value: diff
    })
  }

  d.diffs.economy.employees = compareNumbers(
    productionReportingPeriod.economy?.employees?.value,
    stagingReportingPeriod.economy?.employees?.value,
    productionReportingPeriod.economy?.employees?.metadata.verifiedBy != null
  );
  diffs.push(d.diffs.economy.employees);

  d.diffs.economy.turnover = compareNumbers(
    productionReportingPeriod.economy?.turnover?.value,
    stagingReportingPeriod.economy?.turnover?.value,
    productionReportingPeriod.economy?.turnover?.metadata.verifiedBy != null
  );
  diffs.push(d.diffs.economy.turnover);

  // Emission-wise metrics

  d.eval = reportStatistics(diffs)

  

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

function reportStatistics(diffs: Diff[]) {
  const numbCorrectFields = diffs.reduce((acc: number, current: Diff) => {
    return current.productionValue === current.stagingValue ? acc+1 : acc; // this also captures if both are undefined
  }, 0);
  // How many of the fields are correct?
  const accuracy = {
    description: 'Out of all fields, how many are correct?',
    value: diffs.length > 0 ? numbCorrectFields / diffs.length : undefined
  }
  // Out of all fields that are supposed to have a numerical value, How many are correct? (excludes all instances where prod has an undefined value)
  const dividend = diffs.reduce((acc: number, current: Diff) => { return (current.productionValue !== undefined || current.stagingValue !== undefined) && (current.productionValue === current.stagingValue) ? acc + 1 : acc;}, 0)
  const numbNumericalFields = diffs.reduce((acc: number, current: Diff) => { return (current.productionValue !== undefined || current.stagingValue !== undefined) ? acc + 1 : acc;}, 0);
  const accuracyNumericalFields = {
    description: 'Out of all fields that are supposed to have a numerical value, how many are correct?',
    value: dividend/numbNumericalFields
  }
  // Out of all fields that are supposed to have a numerical value, how many are incorrect because of a magnitude error?
  const magErr = diffs.reduce((acc: number, current: Diff) => {
    return (current.productionValue !== undefined) && 
          (current.stagingValue !== undefined) && 
          ((Math.log10(current.productionValue / current.stagingValue) % 1) === 0 ) ? 
          acc + 1 : acc;
  }, 0);
  const magnError = magErr/numbNumericalFields

  // // Out of all fields that are supposed to have a numerical value, how many have swapped fields?
  // for(let i; i < diffs.length; i++) {
  //   const prod = diffs[i].productionValue
  //   for (let j; j < diffs.length; j++) {
  //     if () {

  //     }
  //   }
  // }
  const fieldswap = diffs.reduce((acc: number, current: Diff) => { return current.productionValue !== undefined ? acc + 1 : acc;}, 0);

  return {
    accuracy,
    accuracyNumericalFields,
    magnError
  }
}


async function outputEvalMetrics(companies: Company[]) {
  const outputPath = resolve('output', 'accuracy-results.csv');
  const outputXLSX = resolve('output', 'accuracy-results.xlsx');
  const csvContent = convertCompanyEvalsToCSV(companies)
  const xlsx = await generateXLSX(csvContent.split('\n'))
  await writeFile(outputXLSX, xlsx, 'utf8');
  await writeFile(outputPath, csvContent, 'utf8');
  console.log(`✅ Accuracy results written to ${outputPath}.`);
  // const sumAccuracy = companies.reduce((acc1: number, company: Company) => {
  //   const sumCompanyAccuracy = company.diffs.reduce((acc2: number, diff: DiffReport) => {
  //     return elems ? acc2 + acc1 : acc2
  //   }, 0)
  //   return acc1 + sumCompanyAccuracy
  // }, 0)
  // const totalAccuracies = companies.reduce((acc: number, company: Company) => {
  //   return company.diffs.length > 0 ? acc+company.diffs.length : acc;
  // }, 0)
  // console.log(`This is the total accuracy of all reports: ${sumAccuracy/totalAccuracies}`)
}

function convertCompanyEvalsToCSV(companies: Company[]): string {
  // Define CSV headers
  const headers = [
    'wikidataId',
    'name',
    'reportingPeriodStart',
    'reportingPeriodEnd',
    'accuracy',
    'accuracyNumericalFields',
    'magnError'
  ];

  const csvContent = headers.join(',')

  const companyRows = companies.map(company => {
    const companyReportPeriodsEval = company.diffs.map(diff => {
      return Object.values({
        wikidataId: company.wikidataId,
        name: company.name,
        reportingPeriodStart: diff.reportingPeriod.startDate.toISOString().substring(0, 10),
        reportingPeriodEnd: diff.reportingPeriod.endDate.toISOString().substring(0, 10),
        accuracy: diff.eval.accuracy?.value,
        accuracyNumericalFields: diff.eval.accuracyNumericalFields?.value,
        magnError: diff.eval.magnError
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
 