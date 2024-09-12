import { resolve } from 'path'
import ExcelJS from 'exceljs'

import { CompanyInput } from './import'
import { isMainModule } from './utils'

const workbook = new ExcelJS.Workbook()
await workbook.xlsx.readFile(resolve('src/data/Company_GHG_data.xlsx'))

function getSheetHeaders({
  sheet,
  row,
}: {
  sheet: ExcelJS.Worksheet
  row: number
}) {
  return Object.values(sheet.getRow(row).values!)
}

function getReportingPeriodDates() {
  const sheet = workbook.getWorksheet('Wiki')!
  const headerRow = 1
  const headers = getSheetHeaders({ sheet, row: headerRow })

  return sheet
    .getSheetValues()
    .slice(headerRow + 1) // Skip header
    .reduce<{ wikidataId: string; startDate: Date; endDate: Date }[]>(
      (rowValues, row) => {
        if (!row) return rowValues

        const wantedColumns = headers.reduce((acc, header, i) => {
          const index = i + 1
          acc[header!.toString()] = row[index]?.result || row[index]
          return acc
        }, {})

        const {
          'Wiki id': wikidataId,
          'Start date': startDate,
          'End date': endDate,
        } = wantedColumns as any

        if (wikidataId) {
          rowValues.push({
            wikidataId,
            startDate,
            endDate,
          })
        }

        return rowValues
      },
      []
    )
}

function getCompanyBaseFacts() {
  const sheet = workbook.getWorksheet('Overview')!
  const headerRow = 2
  const headers = getSheetHeaders({ sheet, row: headerRow })

  return sheet
    .getSheetValues()
    .slice(headerRow + 1) // Skip header
    .reduce<{ wikidataId: string; name: string }[]>((rowValues, row) => {
      if (!row) return rowValues

      const wantedColumns = headers.reduce((acc, header, i) => {
        const index = i + 1
        acc[header!.toString()] = row[index]?.result || row[index]
        return acc
      }, {})

      // TODO: Include "Base year" column once it contains consistent data - this is needed for visualisations
      const { 'Wiki ID': wikidataId, Company: name } = wantedColumns as any

      if (wikidataId) {
        rowValues.push({
          name,
          wikidataId,
        })
      }

      return rowValues
    }, [])
}

function getCompanyData() {
  const reportingPeriodDates = getReportingPeriodDates()
  const baseFacts = getCompanyBaseFacts()

  const companies: Record<string, Partial<CompanyInput>> = {}

  for (const reportingPeriod of reportingPeriodDates) {
    companies[reportingPeriod.wikidataId] = reportingPeriod
  }

  for (const facts of baseFacts) {
    companies[facts.wikidataId] = {
      ...facts,
      ...companies[facts.wikidataId],
    }
  }

  console.log(companies)
}

export async function importSpreadsheetCompanies() {
  const rows = getReportingPeriodDates()
  // TODO: Use combined row to create companies and their emissions

  for (const row of rows) {
    const { wikidataId, startDate, endDate } = row

    // TODO: Create companies that do not exist. Maybe do a first pass of the import to create companies with a separate endpoint, and then add emissions and more datapoints later

    const emissionsArgs = [
      `http://localhost:3000/api/companies/${wikidataId}/${endDate.getFullYear()}/emissions`,
      { startDate, endDate },
    ] as const

    // TODO: save metadata for each datapoint and set the correct user
    await postJSON(...emissionsArgs).then(async (res) => {
      if (!res.ok) {
        const body = await res.text()
        console.error(res.status, res.statusText, wikidataId, body)

        if (res.status === 404) {
          console.log('Creating company...', wikidataId)
          await postJSON(`http://localhost:3000/api/companies/${wikidataId}`, {
            name,
          }).then(async (res) => {
            if (!res.ok) {
              const body = await res.text()
              console.error(res.status, res.statusText, wikidataId, body)
            } else {
              await postJSON(...emissionsArgs).then(async (res) => {
                if (!res.ok) {
                  // TODO: Investigate why companies that were created via a retry didn't get any emissions or scopes.
                  // Maybe the data needs to be passed in differently?
                  const body = await res.text()
                  console.error(res.status, res.statusText, wikidataId, body)
                }
              })
            }
          })
        }
      }
    })
  }
}

async function postJSON(url: string, body: any) {
  return fetch(url, {
    body: JSON.stringify(body),
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
}

async function main() {
  getCompanyData()

  // TODO: await importSpreadsheetCompanies()
}

if (isMainModule(import.meta.url)) {
  await main()
}
