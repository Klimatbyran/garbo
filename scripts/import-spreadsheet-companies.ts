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

/**
 * Translate the reporting period dates into another year. Can handle leap years.
 */
function getPeriodDatesForYear(year: number, startDate: Date, endDate: Date) {
  const start = new Date(
    `${year}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-01`
  )
  const end = new Date(
    `${year}-${(endDate.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${getLastDayInMonth(year, endDate.getMonth())}`
  )

  return [start, end]
}

/**
 * NOTE: Month is 0-indexed like Date.getMonth()
 *
 * Credit: https://stackoverflow.com/a/5301829
 */
function getLastDayInMonth(year: number, month: number) {
  return 32 - new Date(year, month, 32).getDate()
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
          // NOTE: This logging will be useful to find companies without Wiki ID and which thus can't be imported.
          // console.error(
          //   `${year}: Company ${name} was not included since it's missing "Wiki ID" in the "Overview" sheet.`
          // )
          skippedCompanyNames.add(name)
          return
        }

        // TODO: Add comment and source URL as metadata for this year.

        const scope3Categories = Array.from({ length: 15 }, (_, i) => i + 1)
          .map((category) => ({
            category,
            total: wantedColumns[`Cat ${category}`],
          }))
          .concat([{ category: 16, total: wantedColumns[`Other`] }])
          .filter((c) => Number.isFinite(c.total))

        const scope3 = {
          ...(Number.isFinite(scope3StatedTotal)
            ? {
                statedTotalEmissions: {
                  total: scope3StatedTotal,
                },
              }
            : {}),
          ...(scope3Categories.length ? { scope3Categories } : {}),
        }

        const emissions = {
          ...(Number.isFinite(scope1Total)
            ? {
                scope1: {
                  total: scope1Total,
                },
              }
            : {}),
          ...(Number.isFinite(scope2MB) || Number.isFinite(scope2LB)
            ? {
                scope2: {
                  mb: scope2MB,
                  lb: scope2LB,
                },
              }
            : {}),
          ...(Object.keys(scope3).length ? scope3 : {}),
          ...(Number.isFinite(statedTotal)
            ? {
                statedTotalEmissions: {
                  total: statedTotal,
                },
              }
            : {}),
          ...(Number.isFinite(biogenic)
            ? {
                biogenic: {
                  total: biogenic,
                },
              }
            : {}),
        }

        const economy = {
          ...(Number.isFinite(turnover)
            ? {
                turnover: {
                  value: turnover,
                  currency,
                },
              }
            : {}),
          ...(Number.isFinite(employees) || Boolean(employeesUnit)
            ? {
                employees: {
                  value: employees,
                  unit: employeesUnit,
                },
              }
            : {}),
        }

        const { wikidataId: companyId, startDate, endDate } = company

        const [periodStart, periodEnd] = getPeriodDatesForYear(
          year,
          startDate,
          endDate
        )

        const reportingPeriod = {
          companyId,
          startDate: periodStart,
          endDate: periodEnd,
          ...(Object.keys(emissions).length ? { emissions } : {}),
          ...(Object.keys(economy).length ? { economy } : {}),
        }

        if (!reportingPeriodsByCompany[companyId]) {
          reportingPeriodsByCompany[companyId] = []
        }
        // Ignore reportingPeriods without any meaningful data
        if (!reportingPeriod.emissions && !reportingPeriod.economy) {
          console.log('skipping', year, 'for', name)
          return
        }
        reportingPeriodsByCompany[companyId].push(reportingPeriod)
      })
  }

  return reportingPeriodsByCompany
}

/**
 * Get an array of numbers from start to end, with inclusive boundaries.
 */
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
    range(2015, 2023).reverse()
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

// TODO: Rewrite importSpreadsheetCompanies() to just take care of uploading data, and by using the new format.
export async function importSpreadsheetCompanies() {
  const rows = getReportingPeriodDates()

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
    `companies due to missing wikidataId.\n\n`
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
