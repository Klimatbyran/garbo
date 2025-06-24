import 'dotenv/config';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import * as z from 'zod';
import * as schemas from '../src/api/schemas';
import { fetchCompanies } from './utils/fetchUtils';
import { convertCompanyEvalsToCSV, generateXLSX } from './utils/outputFunctions';

type CompanyList = z.infer<typeof schemas.CompanyList>;
type ReportingPeriod  = z.infer<typeof schemas.MinimalReportingPeriodSchema>;
type CompanyResponse = z.infer<typeof schemas.MinimalCompanyBase>;
const NUMBER_OF_CATEGORIES = 16;
const ONLY_CHECK_VERIFIED_DATA = true;

interface Diff {
  productionValue?: number;
  stagingValue?: number;
  difference?: number;
  differencePerct?: number;
}

export interface Company {
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
    accuracy?: {
      description?: string,
      value?: number,
      numbCorrectFieldsIncludeUndefined?: number,
      numbFields?: number};
    accuracyNumericalFields?: {
      description?: string,
      value?: number,
      numbCorrectNumericalFields?: number,
      numbNumericalFields?: number};
    magnError?: number;
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
        diffs: []
      })
      if (reportingYear) {
        const prodReportingPeriod = productionCompany?.reportingPeriods.find((period) => typeof period.startDate === 'string' ? period.startDate.includes(reportingYear) : period.startDate.toString().includes(reportingYear))
        const stagingReportingPeriod = prodReportingPeriod ? stagingCompany?.reportingPeriods.find((periodI) => periodI.startDate === prodReportingPeriod.startDate && periodI.endDate === prodReportingPeriod.endDate) : undefined;
        if(stagingReportingPeriod && prodReportingPeriod) {
          const diff = compareReportingPeriods(prodReportingPeriod, stagingReportingPeriod, productionCompany);
          const existingCompany = companies.find((companyI) => companyI.wikidataId === productionCompany.wikidataId);
          existingCompany?.diffs.push(diff);
        }
      }
      else {
        for(const reportingPeriod of productionCompany.reportingPeriods) {
          const stagingReportingPeriod = stagingCompany?.reportingPeriods.find((periodI) => periodI.startDate === reportingPeriod.startDate && periodI.endDate === reportingPeriod.endDate);
          if(stagingReportingPeriod) {
            const diff = compareReportingPeriods(reportingPeriod, stagingReportingPeriod, productionCompany);
            const existingCompany = companies.find((companyI) => companyI.wikidataId === productionCompany.wikidataId);
            existingCompany?.diffs.push(diff);
          }
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
  const numbCorrectFieldsIncludeUndefined = diffs.reduce((acc: number, current: Diff) => {
    return current.productionValue === current.stagingValue ? acc+1 : acc; // this also captures if both are undefined
  }, 0);
  // How many of the fields are correct?
  const accuracy = {
    description: 'Out of all fields, how many are correct?',
    value: diffs.length > 0 ? numbCorrectFieldsIncludeUndefined / diffs.length : undefined,
    numbCorrectFieldsIncludeUndefined,
    numbFields: diffs.length
  }
  // Out of all fields that are supposed to have a numerical value, How many are correct? (excludes all instances where prod has an undefined value)
  const numbCorrectNumericalFields = diffs.reduce((acc: number, current: Diff) => { return !(current.productionValue === undefined && current.stagingValue === undefined) && (current.productionValue === current.stagingValue) ? acc + 1 : acc;}, 0)
  const numbNumericalFields = diffs.reduce((acc: number, current: Diff) => { return !(current.productionValue === undefined && current.stagingValue === undefined) ? acc + 1 : acc;}, 0);
  const accuracyNumericalFields = {
    description: 'Out of all fields that are supposed to have a numerical value, how many are correct?',
    value: numbCorrectNumericalFields/numbNumericalFields,
    numbCorrectNumericalFields,
    numbNumericalFields
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
  console.log(`✅ Statistics per report, written to ${outputPath}.`);
}

function outputTotalStatistics(companies: Company[]) {

  const sumCorrectFieldsIncludeUndefined = companies.reduce((acc1: number, company: Company) => {
    const sumCompanyCorrectFields = company.diffs.reduce((acc2: number, diff: DiffReport) => {
      return diff.eval.accuracy?.numbCorrectFieldsIncludeUndefined ? acc2 + diff.eval.accuracy?.numbCorrectFieldsIncludeUndefined : acc2
    }, 0)
    return acc1 + sumCompanyCorrectFields
  }, 0)
  const sumNumbFields = companies.reduce((acc1: number, company: Company) => {
    const sumCompanyFields = company.diffs.reduce((acc2: number, diff: DiffReport) => {
      return diff.eval.accuracy?.numbFields ? acc2 + diff.eval.accuracy?.numbFields : acc2
    }, 0)
    return acc1 + sumCompanyFields
  }, 0)

  const sumCorrectFields = companies.reduce((acc1: number, company: Company) => {
    const sumCompanyCorrectFields = company.diffs.reduce((acc2: number, diff: DiffReport) => {
      return diff.eval.accuracyNumericalFields?.numbCorrectNumericalFields ? acc2 + diff.eval.accuracyNumericalFields?.numbCorrectNumericalFields : acc2
    }, 0)
    return acc1 + sumCompanyCorrectFields
  }, 0)
  const sumFields = companies.reduce((acc1: number, company: Company) => {
    const sumCompanyFields = company.diffs.reduce((acc2: number, diff: DiffReport) => {
      return diff.eval.accuracyNumericalFields?.numbNumericalFields ? acc2 + diff.eval.accuracyNumericalFields?.numbNumericalFields : acc2
    }, 0)
    return acc1 + sumCompanyFields
  }, 0)
  console.log(`sumCorrectFieldsIncludingUndefined: ${sumCorrectFieldsIncludeUndefined}, sumFieldsIncludingUndefined: ${sumNumbFields}`)
  console.log(`sumCorrectFields: ${sumCorrectFields}, sumFields: ${sumFields}`)
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
 