import { isMainModule } from './utils'
import 'dotenv/config'
import ExcelJS from 'exceljs'
import { resolve } from 'path'
import apiConfig from '../src/config/api'
import { postJSON, range, USERS } from './import-spreadsheet-companies'

const workbook = new ExcelJS.Workbook()
await workbook.xlsx.readFile(resolve('src/data/Company GHG data.xlsx'))

function getSheetHeaders({
  sheet,
  row,
}: {
  sheet: ExcelJS.Worksheet
  row: number
}) {
  return Object.values(sheet.getRow(row).values!)
}

const { baseURL } = apiConfig

const HIDDEN_FROM_API = new Set([
  'Q22629259',
  'Q37562781',
  'Q489097',
  'Q10432209',
  'Q5168854',
  'Q115167497',
  'Q549624',
  'Q34',
  'Q8301325',
  'Q112055015',
  'Q97858523',
  'Q2438127',
  'Q117352880',
  'Q115167497',
])

async function updateReportURLs(years: number[]) {
  const sheet = workbook.getWorksheet('import')!
  const headers = getSheetHeaders({ sheet, row: 2 })

  const baseCompanies = sheet
    .getSheetValues()
    .slice(3)
    .reduce<{ wikidataId: string; name: string }[]>((companies, row) => {
      if (!row) return companies
      const columns = headers.reduce((acc, header, i) => {
        acc[header!.toString()] = row[i + 1]?.result || row[i + 1]
        return acc
      }, {} as any)
      if (!HIDDEN_FROM_API.has(columns['Wiki ID'])) {
        companies.push({
          wikidataId: columns['Wiki ID'],
          name: columns['Company'],
        })
      }
      return companies
    }, [])

  for (const year of years) {
    const sheet = workbook.getWorksheet(year.toString())
    if (!sheet) continue
    const headers = getSheetHeaders({ sheet, row: 2 })

    sheet
      .getSheetValues()
      .slice(3) // Skip header
      .forEach((row) => {
        if (!row) return

        const columns = headers.reduce((acc, header, i) => {
          const index = i + 1
          acc[header!.toString()] =
            row[index]?.result || row[index]?.hyperlink || row[index]
          return acc
        }, {})

        const company = baseCompanies.find(
          (c) =>
            c.name.trim().toLowerCase() ===
            columns['Company']?.trim().toLowerCase()
        )

        if (company && columns[`URL ${year}`]) {
          const body = JSON.stringify({
            year: year.toString(),
            reportURL: columns[`URL ${year}`],
          })

          try {
            return fetch(
              `${baseURL}/companies/${company.wikidataId}/report-url`,
              {
                body,
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${USERS['garbo'].token}`,
                },
              }
            )
          } catch (error) {
            console.error('Failed to fetch:', error)
            throw error
          }
        }
      })
  }
}

async function main() {
  const years = range(2015, 2023).reverse()
  await updateReportURLs(years)
  console.log('✅ Report URLs updated.')
}

if (isMainModule(import.meta.url)) {
  await main()
}
