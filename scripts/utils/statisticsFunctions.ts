import { Diff, DiffReport, Company, } from '../comparing-staging-production'

export function reportStatistics(diffs: Diff[]) {
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

export function outputTotalStatistics(companies: Company[]) {

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
  console.log(`Accuracy including undefined: ${sumCorrectFieldsIncludeUndefined} out of ${sumNumbFields}, ${sumCorrectFieldsIncludeUndefined/sumNumbFields}`)
  console.log(`Accuracy excluding undefined: ${sumCorrectFields} out of ${sumFields}, ${sumCorrectFields/sumFields}`)
}