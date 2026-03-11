import ExcelJS from 'exceljs'
import { Company } from '../comparing-staging-production'

export function convertCompanyEvalsToCSV(companies: Company[]): string {
  const headers = [
    'wikidataId',
    'name',
    'reportingPeriodStart',
    'reportingPeriodEnd',
    'accuracyWithoutUndefined-proportion',
    'accuracyWithoutUndefined-numbCorrect',
    'accuracyWithoutUndefined-numbFields',
    'precisionValueOrNot',
    'precisionValueOrNot-numbHasActualValueAndIsExtracted',
    'precisionValueOrNot-numbExtractedValues',
    'recallValueOrNot',
    'recallValueOrNot-numbHasActualValueAndIsExtracted',
    'recallValueOrNot-numbActualValues',
    'magnError-proportion',
    'magnError-numbErrors',
    'magnError-numbFields',
    'fieldSwapError-proportion',
    'fieldSwapError-numbError',
    'fieldSwapError-numbFields',
  ]
  const csvContent = headers.join(',')
  const companyRows = companies.map((company) => {
    const companyReportPeriodsEval = company.diffReports.map((diff) => {
      return Object.values({
        wikidataId: company.wikidataId,
        name: company.name,
        reportingPeriodStart: diff.reportingPeriod.startDate
          .toISOString()
          .substring(0, 10),
        reportingPeriodEnd: diff.reportingPeriod.endDate
          .toISOString()
          .substring(0, 10),
        'accuracyWithoutUndefined-proportion':
          diff.eval.accuracyNumericalFields?.value,
        'accuracyWithoutUndefined-numbCorrect':
          diff.eval.accuracyNumericalFields?.numbCorrectNumericalFields,
        'accuracyWithoutUndefined-numbFields':
          diff.eval.accuracyNumericalFields?.numbNumericalFields,
        precision: diff.eval.precision?.value,
        'precision-numbHasActualValueAndIsExtracted':
          diff.eval.precision?.numbHasActualValueAndIsExtracted,
        'precision-numbExtractedValues':
          diff.eval.precision?.numbExtractedValues,
        recall: diff.eval.recall?.value,
        'recall-numbHasActualValueAndIsExtracted':
          diff.eval.recall?.numbHasActualValueAndIsExtracted,
        'recall-numbActualValues': diff.eval.recall?.numbActualValues,
        'magnError-proportion': diff.eval.magnError?.value,
        'magnError-numbErrors': diff.eval.magnError?.magnErr,
        'magnError-numbFields': diff.eval.magnError?.numbNumericalFields,
        'fieldSwapError-proportion': diff.eval.fieldSwapError?.value,
        'fieldSwapError-numbError': diff.eval.fieldSwapError?.fieldSwap,
        'fieldSwapError-numbFields':
          diff.eval.fieldSwapError?.numbNumericalFields,
      }).join(',')
    })
    return companyReportPeriodsEval.join('\n')
  })
  return csvContent + '\n' + companyRows.join('\n')
}

export async function generateXLSX(data: string[]): Promise<Buffer> {
  if (data.length === 0) throw new Error('No data to export')
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Data')
  const rows = data.map((row) => row.split(','))
  for (const row of rows) {
    worksheet.addRow(row)
  }
  const buffer = await workbook.xlsx.writeBuffer()

  return Buffer.from(buffer)
}
