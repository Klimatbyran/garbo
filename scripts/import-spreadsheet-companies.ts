import { resolve } from 'path'
import ExcelJS from 'exceljs'

import { isMainModule } from './utils'

export async function importSpreadsheetCompanies() {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(resolve('src/data/Company_GHG_data.xlsx'))

  const sheet = workbook.getWorksheet('Wiki')!

  const rows = sheet
    .getSheetValues()
    .slice(2) // Skip empty rows and header
    .map((row) => {
      if (!row) return row
      const headers = Object.values(sheet.getRow(1).values!)

      return headers.reduce((acc, header, i) => {
        const index = i + 1
        acc[header!.toString()] = row[index]?.result || row[index]
        return acc
      }, {})
    })
    .map(
      ({
        'Wiki id': wikidataId,
        ' Scope 1': scope1,
        'Scope 2 (market based)': mb,
        'Scope 2 (location based)': lb,
        'Start date': startDate,
        'End date': endDate,
        url,
      }) => ({
        wikidataId,
        scope1: { total: scope1 },
        scope2: { mb, lb },
        startDate,
        endDate,
        url,
      })
    )

  // console.log(rows)

  for (const {
    wikidataId,
    scope1,
    scope2: scope2Unchecked,
    url,
    startDate,
    endDate,
  } of rows) {
    // TODO: Maybe use zod to parse input data add default values to handle edge cases instead?
    const scope2 =
      scope2Unchecked.mb || scope2Unchecked.lb ? scope2Unchecked : undefined

    // TODO: Create companies that do not exist. Maybe do a first pass of the import to create companies with a separate endpoint, and then add emissions and more datapoints later

    await fetch(
      `http://localhost:3000/api/companies/${wikidataId}/${endDate.getFullYear()}/emissions`,
      {
        body: JSON.stringify({ scope1, scope2, url, startDate, endDate }),
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    ).then(async (res) => {
      if (!res.ok) {
        const body = await res.text()
        console.error(res.status, res.statusText, wikidataId, body)
      }
    })
  }
}

async function main() {
  await importSpreadsheetCompanies()
}

if (isMainModule(import.meta.url)) {
  await main()
}
