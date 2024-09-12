import ExcelJS from 'exceljs'
import { resolve } from 'path'
import { writeFile } from 'fs/promises'

import {
  CompanyInput,
  EmissionsInput,
  MetadataInput,
  ReportingPeriodInput,
} from './import'
import { isMainModule } from './utils'

const workbook = new ExcelJS.Workbook()
await workbook.xlsx.readFile(resolve('src/data/Company_GHG_data.xlsx'))

const skippedCompanyNames = new Set()

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
    .reduce<{ wikidataId: string; name: string; internalComment?: string }[]>(
      (rowValues, row) => {
        if (!row) return rowValues

        const wantedColumns = headers.reduce((acc, header, i) => {
          const index = i + 1
          acc[header!.toString()] = row[index]?.result || row[index]
          return acc
        }, {})

        // TODO: Include "Base year" column once it contains consistent data - this is needed for visualisations
        const {
          'Wiki ID': wikidataId,
          Company: name,
          'General Comment': internalComment,
        } = wantedColumns as any

        if (wikidataId) {
          rowValues.push({
            name,
            wikidataId,
            internalComment,
          })
        }

        return rowValues
      },
      []
    )
}

function getReportingPeriods(
  rawCompanies: {
    wikidataId: string
    name: string
    startDate: Date
    endDate: Date
  }[],
  years: number[]
): Record<string, ReportingPeriodInput[]> {
  const reportingPeriodsByCompany: Record<string, ReportingPeriodInput[]> = {}

  // For each year, get the reporting period of each company
  for (const year of years) {
    const sheet = workbook.getWorksheet(year.toString())!
    const headerRow = 2
    const headers = getSheetHeaders({ sheet, row: headerRow })

    sheet
      .getSheetValues()
      .slice(headerRow + 1) // Skip header
      .forEach((row) => {
        if (!row) return

        const wantedColumns = headers.reduce((acc, header, i) => {
          const index = i + 1
          acc[header!.toString()] = row[index]?.result || row[index]
          return acc
        }, {})

        // TODO: Include "Base year" column once it contains consistent data - this is needed for visualisations
        const {
          Company: name,
          // [`URL ${year}`]: source,
          'Scope 1': scope1Total,
          'Scope 2 (LB)': scope2LB,
          'Scope 2 (MB)': scope2MB,
          'Scope 3 (total)': scope3StatedTotal,
          Total: statedTotal,
          'Biogenic (outside of scopes)': biogenic,
          Turnover: turnover,
          Currency: currency,
          'No of Employees': employees,
          Unit: employeesUnit,
        } = wantedColumns as any

        const company = rawCompanies.find((c) => c.name === name)

        if (!company) {
          console.error(
            `${year}: Company ${name} was not included since it's missing "Wiki ID" in the "Overview" sheet.`
          )
          skippedCompanyNames.add(name)
          return
        }

        // TODO: Add comment and source URL as metadata for this year.

        const emissions = {
          scope1: {
            total: scope1Total,
          },
          scope2: {
            mb: scope2MB,
            lb: scope2LB,
          },
          scope3: {
            statedTotalEmissions: {
              total: scope3StatedTotal,
            },
            scope3Categories: Array.from({ length: 15 }, (_, i) => i + 1)
              .map((category) => ({
                category,
                total: wantedColumns[`Cat ${category}`],
              }))
              .concat([{ category: 16, total: wantedColumns[`Other`] }])
              .filter((c) => Number.isFinite(c.total)),
          },
          statedTotalEmissions: {
            total: statedTotal,
          },
          biogenic: {
            total: biogenic,
          },
        }

        const economy = {
          turnover: {
            value: turnover,
            currency,
          },
          employees: {
            value: employees,
            unit: employeesUnit,
          },
        }

        const { wikidataId: companyId, startDate, endDate } = company

        const reportingPeriod = {
          companyId,
          startDate,
          endDate,
          emissions,
          economy,
        }

        if (!reportingPeriodsByCompany[companyId]) {
          reportingPeriodsByCompany[companyId] = []
        }
        reportingPeriodsByCompany[companyId].push(reportingPeriod)
      })
  }

  return reportingPeriodsByCompany
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

function getCompanyData() {
  const reportingPeriodDates = getReportingPeriodDates()
  const baseFacts = getCompanyBaseFacts()

  const rawCompanies: Record<
    string,
    {
      wikidataId: string
      name: string
      startDate: Date
      endDate: Date
    }
  > = {}

  for (const dates of reportingPeriodDates) {
    rawCompanies[dates.wikidataId] = {
      ...rawCompanies[dates.wikidataId],
      ...dates,
    }
  }

  for (const facts of baseFacts) {
    rawCompanies[facts.wikidataId] = {
      ...facts,
      ...rawCompanies[facts.wikidataId],
    }
  }

  const reportingPeriodsByCompany = getReportingPeriods(
    Object.values(rawCompanies),
    [2023]
    // NOTE: When we want all historic data, we could do like this:
    // range(2015, 2023)
  )

  const companies: CompanyInput[] = []

  for (const [wikidataId, reportingPeriods] of Object.entries(
    reportingPeriodsByCompany
  )) {
    companies.push({
      wikidataId,
      name: rawCompanies[wikidataId].name,
      reportingPeriods,
    })
  }

  return companies
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
  const companies = getCompanyData()

  console.log(
    `\n\n✅ Imported`,
    companies.length,
    `and skipped`,
    skippedCompanyNames.size,
    `companies due to missing data.\n\n`
  )

  await writeFile(
    resolve('output/spreadsheet-import.json'),
    JSON.stringify(companies, null, 2),
    { encoding: 'utf-8' }
  )

  // TODO: upload company data
}

if (isMainModule(import.meta.url)) {
  await main()
}
