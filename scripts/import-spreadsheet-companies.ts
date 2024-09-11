import { resolve } from 'path'
import ExcelJS from 'exceljs'

import { InitialDBState } from './import'

// export async function importSpreadsheetCompanies({}: InitialDBState) {
export async function importSpreadsheetCompanies(seededData: InitialDBState) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(resolve('src/data/Company_GHG_data.xlsx'))

  //   for each worksheet, print the name
  // maybe remove the sheets that are not needed
  const sheet = workbook.getWorksheet('Wiki')!

  const rows = sheet
    .getSheetValues()
    .map((row) => {
      if (!row) return row
      const headers = Object.values(sheet.getRow(1).values!)

      return headers.reduce((acc, header, i) => {
        const index = i + 1
        acc[header!.toString()] = row[index]?.result || row[index]
        return acc
      }, {})
    })
    .map(({ 'Wiki id': wikidataId, ' Scope 1': scope1, Year: year }) => ({
      wikidataId,
      scope1,
      year,
    }))

  console.log(rows)

  rows.map(({ year, wikidataId, scope1 }) => {
    fetch(
      `http://localhost:3000/api/companies/${wikidataId}/${year}/emissions`,
      {
        body: JSON.stringify({ scope1 }),
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    )
  })
}
