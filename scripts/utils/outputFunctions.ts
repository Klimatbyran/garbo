import ExcelJS from 'exceljs';
import { Company } from '../comparing-staging-production'

export function convertCompanyEvalsToCSV(companies: Company[]): string {
  const headers = [
    'wikidataId',
    'name',
    'reportingPeriodStart',
    'reportingPeriodEnd',
    'accuracy',
    'accuracyNumericalFields',
    'magnError'
  ]
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


export async function generateXLSX(data: string[]): Promise<Buffer> {
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