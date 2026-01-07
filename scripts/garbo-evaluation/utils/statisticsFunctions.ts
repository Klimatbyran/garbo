import { Diff, DiffReport, Company, } from '../comparing-staging-production'

export function reportStatistics(diffs: Diff[]) {
  const prodOrStagingHasNumericValue = (current: Diff) => {return current.productionValue !== undefined || current.stagingValue !== undefined}
  const prodAndStagingHasNumericValue = (current: Diff) => {return current.productionValue !== undefined && current.stagingValue !== undefined}

  // Helper function to check if values are equal within tolerance
  const valuesAreEqual = (prod: number | undefined, staging: number | undefined): boolean => {
    if (prod === undefined || prod === null || staging === undefined || staging === null) {
      return prod === staging;
    }
    return Math.abs(prod - staging) < 0.01;
  };

  // Out of all fields that are supposed to have a numerical value, How many are correct? (excludes all instances where prod has an undefined value)
  const numbCorrectNumericalFields = diffs.reduce((acc: number, current: Diff) => { return prodOrStagingHasNumericValue(current) && valuesAreEqual(current.productionValue, current.stagingValue) ? acc + 1 : acc;}, 0)
  const numbNumericalFields = diffs.reduce((acc: number, current: Diff) => { return prodOrStagingHasNumericValue(current) ? acc + 1 : acc;}, 0);
  const accuracyNumericalFields = {
    description: 'Out of all fields that are supposed to have a numerical value, how many are correct?',
    value: numbCorrectNumericalFields/numbNumericalFields,
    numbCorrectNumericalFields,
    numbNumericalFields
  }

  const numbHasActualValueAndIsExtracted = diffs.reduce((acc: number, current: Diff) => { return prodAndStagingHasNumericValue(current) ? acc + 1 : acc;}, 0);
  const numbExtractedValues = diffs.reduce((acc: number, current: Diff) => { return current.stagingValue !== undefined ? acc + 1 : acc;}, 0);
  const numbActualValues = diffs.reduce((acc: number, current: Diff) => { return current.productionValue !== undefined ? acc + 1 : acc;}, 0);

  // Out of all the extracted values by Garbo (staging), how many are actually a value and how many are made up by Garbo?
  const precisionValueOrNot = {
    description: 'Out of all the extracted values by Garbo, how many are actually a value and how many are made up by Garbo?',
    value: numbHasActualValueAndIsExtracted/numbExtractedValues,
    numbHasActualValueAndIsExtracted,
    numbExtractedValues
  }

  // Out of all the true values (prod), how many of them could Garbo extract a value for and how many could it not?
  const recallValueOrNot = {
    description: 'Out of all the true values, how many of them could Garbo extract a value for and how many could it not?',
    value: numbHasActualValueAndIsExtracted/numbActualValues,
    numbHasActualValueAndIsExtracted,
    numbActualValues
  }

  // Out of all fields that are supposed to have a numerical value, how many are incorrect because of a magnitude error?
  const magErr = diffs.reduce((acc: number, current: Diff) => {
    return (current.productionValue !== undefined) && 
          (current.stagingValue !== undefined) &&
          (current.stagingValue !== current.productionValue) &&
          (Number.isInteger(Math.log10(current.productionValue / current.stagingValue))) ? 
          acc + 1 : acc;
  }, 0);
  const magnError = {
    description: 'Out of all fields that are supposed to have a numerical value, how many are incorrect because of a magnitude error?',
    value: magErr/numbNumericalFields,
    magnErr: magErr,
    numbNumericalFields
  }

  // Out of all fields that are supposed to have a numerical value, how many have swapped fields?
  let fieldSwap = 0
  for(let i; i < diffs.length; i++) {
    const prod = diffs[i].productionValue
    const fds = diffs.reduce((acc: number, current: Diff, currentIndex: number) => { return i !== currentIndex && current.stagingValue === prod ? acc + 1 : acc }, 0)
    fieldSwap += fds
  }
  const fieldSwapError = {
    description: 'Out of all fields that are supposed to have a numerical value, how many have swapped fields?',
    value: fieldSwap/numbNumericalFields,
    fieldSwap,
    numbNumericalFields,
  }

  return {
    accuracyNumericalFields,
    precisionValueOrNot,
    recallValueOrNot,
    magnError,
    fieldSwapError
  }
}

export function outputTotalStatistics(companies: Company[]) {
    const sumCorrectFields = companies.reduce((acc1: number, company: Company) => {
    const sumCompanyCorrectFields = company.diffReports.reduce((acc2: number, diff: DiffReport) => {
        return diff.eval.accuracyNumericalFields?.numbCorrectNumericalFields ? acc2 + diff.eval.accuracyNumericalFields?.numbCorrectNumericalFields : acc2
    }, 0)
    return acc1 + sumCompanyCorrectFields
    }, 0)
    const sumFields = companies.reduce((acc1: number, company: Company) => {
    const sumCompanyFields = company.diffReports.reduce((acc2: number, diff: DiffReport) => {
        return diff.eval.accuracyNumericalFields?.numbNumericalFields ? acc2 + diff.eval.accuracyNumericalFields?.numbNumericalFields : acc2
    }, 0)
    return acc1 + sumCompanyFields
    }, 0)

    const sumMagnErr = companies.reduce((acc1: number, company: Company) => {
    const sumCompanyMagnErr = company.diffReports.reduce((acc2: number, diff: DiffReport) => {
        return diff.eval.magnError?.magnErr ? acc2 + diff.eval.magnError?.magnErr : acc2
    }, 0)
    return acc1 + sumCompanyMagnErr
    }, 0)
    const sumNumericFields = companies.reduce((acc1: number, company: Company) => {
    const sumCompanyFields = company.diffReports.reduce((acc2: number, diff: DiffReport) => {
        return diff.eval.magnError?.numbNumericalFields ? acc2 + diff.eval.magnError?.numbNumericalFields : acc2
    }, 0)
    return acc1 + sumCompanyFields
    }, 0)
    console.log(`Accuracy excluding undefined: ${sumCorrectFields} out of ${sumFields}, ${sumCorrectFields/sumFields}`)
    console.log(`Magnitude error: ${sumMagnErr} out of ${sumNumericFields}, ${sumMagnErr/sumNumericFields}`)
}