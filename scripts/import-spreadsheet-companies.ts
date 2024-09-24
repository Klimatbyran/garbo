import ExcelJS from 'exceljs'
import { resolve } from 'path'
import { z } from 'zod'

import { CompanyInput, ReportingPeriodInput } from './import'
import { isMainModule } from './utils'
import { resetDB } from '../src/lib/dev-utils'
import { getName, getWikidataId } from './import-garbo-companies'
import garboCompanies from '../companies.json'

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

const envSchema = z.object({
  /**
   * API tokens, parsed from a string like garbo:lk3h2k1,alex:ax32bg4
   * NOTE: This is only relevant during import with alex data, and then we switch to proper auth tokens.
   */
  API_TOKENS: z.string().transform((tokens) =>
    tokens
      .split(',')
      .reduce<{ garbo: string; alex: string }>((tokens, token) => {
        const [name] = token.split(':')
        tokens[name] = token
        return tokens
      }, {} as any)
  ),
})

const ENV = envSchema.parse(process.env)

const USERS = {
  garbo: {
    id: 1,
    token: ENV.API_TOKENS.garbo,
  },
  alex: {
    id: 2,
    token: ENV.API_TOKENS.alex,
  },
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
          Batch,
          'Wiki ID': wikidataId,
          Company: name,
          'General Comment': internalComment,
        } = wantedColumns as any

        // TODO: temporarily only include companies from the MVP batch
        if (wikidataId && Batch?.trim()?.toUpperCase() === 'MVP') {
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
function getPeriodDatesForYear(
  endYear: number,
  startDate: Date,
  endDate: Date
) {
  // Handle broken reporting periods
  const diff = endDate.getFullYear() - startDate.getFullYear()

  const start = new Date(
    `${endYear - diff}-${(startDate.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-01`
  )
  const end = new Date(
    `${endYear}-${(endDate.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${getLastDayInMonth(endYear, endDate.getMonth())}`
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
          acc[header!.toString()] =
            row[index]?.result || row[index]?.hyperlink || row[index]
          return acc
        }, {})

        // TODO: Include "Base year" column once it contains consistent data - this is needed for visualisations
        // Or if this should be imported later, do it in a separate script

        // TODO: Add comment and reportURL as metadata for this year.
        const {
          Company: name,
          [`URL ${year}`]: reportURL,
          'Scope 1': scope1Total,
          'Scope 2 (LB)': scope2LB,
          // TODO: Add scope1And2
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

        const scope1 = {
          ...(Number.isFinite(scope1Total)
            ? {
                total: scope1Total,
              }
            : {}),
        }

        const scope2 = {
          ...(Number.isFinite(scope2MB) ? { mb: scope2MB } : {}),
          ...(Number.isFinite(scope2LB) ? { lb: scope2LB } : {}),
        }

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
          ...(Object.keys(scope1).length ? { scope1 } : {}),
          ...(Object.keys(scope2).length ? { scope2 } : {}),
          ...(Object.keys(scope3).length ? { scope3 } : {}),
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
          reportURL,
          ...(Object.keys(emissions).length ? { emissions } : {}),
          ...(Object.keys(economy).length ? { economy } : {}),
        }

        reportingPeriodsByCompany[companyId] ??= []
        // Ignore reportingPeriods without any meaningful data
        if (!reportingPeriod.emissions && !reportingPeriod.economy) {
          console.log(
            'Skipping',
            year,
            `for "${name}" due to missing emissions and economy data`
          )
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

function getCompanyData(years: number[]) {
  const reportingPeriodDates = getReportingPeriodDates()
  const baseFacts = getCompanyBaseFacts()

  const rawCompanies: Record<
    string,
    {
      wikidataId: string
      name: string
      description?: string
      internalComment?: string
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
    years
  )

  const companies: CompanyInput[] = []

  for (const [wikidataId, reportingPeriods] of Object.entries(
    reportingPeriodsByCompany
  )) {
    companies.push({
      wikidataId,
      name: rawCompanies[wikidataId].name,
      description: rawCompanies[wikidataId].description,
      internalComment: rawCompanies[wikidataId].internalComment,
      reportingPeriods,
    })
  }

  return companies
}

export async function updateCompanies(companies: CompanyInput[]) {
  const verifiedMetadata = {
    comment: 'Import from spreadsheet with verified data',
  }

  for (const company of companies) {
    const { wikidataId, name, description, reportingPeriods, internalComment } =
      company

    await postJSON(
      `http://localhost:3000/api/companies`,
      {
        wikidataId,
        name,
        description: description || undefined,
        internalComment,
        metadata: {
          ...verifiedMetadata,
        },
      },
      'alex'
    ).then(async (res) => {
      if (!res.ok) {
        const body = await res.text()
        console.error(res.status, res.statusText, wikidataId, body)
      }
    })

    for (const reportingPeriod of reportingPeriods) {
      if (reportingPeriod.emissions) {
        const emissionsArgs = [
          `http://localhost:3000/api/companies/${wikidataId}/${reportingPeriod.endDate.getFullYear()}/emissions`,
          {
            startDate: reportingPeriod.startDate,
            endDate: reportingPeriod.endDate,
            reportURL: reportingPeriod.reportURL,
            emissions: reportingPeriod.emissions,
            metadata: {
              ...verifiedMetadata,
              source: reportingPeriod.reportURL,
            },
          },
          'alex',
        ] as const

        await postJSON(...emissionsArgs).then(async (res) => {
          if (!res.ok) {
            const body = await res.text()
            console.error(res.status, res.statusText, wikidataId, body)
          }
        })
      }

      if (reportingPeriod.economy) {
        const economyArgs = [
          `http://localhost:3000/api/companies/${wikidataId}/${reportingPeriod.endDate.getFullYear()}/economy`,
          {
            startDate: reportingPeriod.startDate,
            endDate: reportingPeriod.endDate,
            reportURL: reportingPeriod.reportURL,
            economy: reportingPeriod.economy,
            metadata: {
              ...verifiedMetadata,
              source: reportingPeriod.reportURL,
            },
          },
          'alex',
        ] as const

        await postJSON(...economyArgs).then(async (res) => {
          if (!res.ok) {
            const body = await res.text()
            console.error(res.status, res.statusText, wikidataId, body)
          }
        })
      }
    }
  }
}

async function postJSON(url: string, body: any, user: keyof typeof USERS) {
  try {
    return await fetch(url, {
      body: JSON.stringify(body),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${USERS[user].token}`,
      },
    })
  } catch (error) {
    console.error('Failed to fetch:', error)
    throw error
  }
}

async function importGarboData(companies: CompanyInput[]) {
  const actualCompanies = garboCompanies.filter((company) =>
    companies.some((c) => c.wikidataId === getWikidataId(company))
  )

  const metadata = {
    comment: 'Imported from Garbo',
    source: 'https://klimatkollen.se',
  }

  for (const company of actualCompanies) {
    const wikidataId = getWikidataId(company)
    const reportURL = company?.facit?.url || company.url
    const name = getName(company)
    const description = company.description || undefined

    await postJSON(
      `http://localhost:3000/api/companies`,
      {
        wikidataId,
        name,
        description,
        metadata: {
          ...metadata,
          source: reportURL || metadata.source,
        },
      },
      'garbo'
    ).then(async (res) => {
      if (!res.ok) {
        const body = await res.text()
        console.error(res.status, res.statusText, wikidataId, body)
      }
    })

    if (Array.isArray(company.goals)) {
      const goals = company.goals
        .map(
          ({
            description,
            year,
            target,
            baseYear,
          }: (typeof company.goals)[number]) => {
            if (description || year || target || baseYear) {
              return {
                description: description || undefined,
                target: target || undefined,
                year: year?.toString() || undefined,
                baseYear: baseYear || undefined,
              }
            }
          }
        )
        .filter(Boolean)

      await postJSON(
        `http://localhost:3000/api/companies/${wikidataId}/goals`,
        {
          goals,
          metadata: {
            ...metadata,
            source: reportURL || metadata.source,
          },
        },
        'alex'
      ).then(async (res) => {
        if (!res.ok) {
          const body = await res.text()
          console.error(res.status, res.statusText, wikidataId, body)
        }
      })
    }

    if (Array.isArray(company.initiatives)) {
      const initiatives = company.initiatives
        .map(
          ({
            title,
            description,
            scope,
            year,
          }: (typeof company.initiatives)[number]) => {
            if (title || description || scope || year) {
              return {
                title: title || undefined,
                description: description || undefined,
                year: year?.toString() || undefined,
                scope: scope || undefined,
              }
            }
          }
        )
        .filter(Boolean)

      await postJSON(
        `http://localhost:3000/api/companies/${wikidataId}/initiatives`,
        {
          initiatives,
          metadata: {
            ...metadata,
            source: reportURL || metadata.source,
          },
        },
        'alex'
      ).then(async (res) => {
        if (!res.ok) {
          const body = await res.text()
          console.error(res.status, res.statusText, wikidataId, body)
        }
      })
    }
  }
}

async function main() {
  // TODO: use this to import historical data:
  // const companies = getCompanyData(range(2015, 2023).reverse())
  const companies = getCompanyData([2023])
    // NOTE: Useful for testing upload of only specific companies
    // .filter(
    //   (x) =>
    //     x.reportingPeriods?.[0]?.emissions?.scope3?.scope3Categories &&
    //     x.reportingPeriods?.[0]?.emissions?.scope3?.statedTotalEmissions
    // )
    .filter((x) => x.reportingPeriods?.[0]?.emissions?.biogenic?.total)
    .slice(0, 1)

  await resetDB()

  console.log('Creating companies based on Garbo data...')
  await importGarboData(companies)

  console.log('Updating companies based on spreadsheet data...')
  await updateCompanies(companies)

  // TODO: Add garbo data for industryGics

  // TODO: Add industryGics based on spreadsheet data (or garbo data if it is missing)

  console.log(
    `\n\n✅ Imported`,
    companies.length,
    `and skipped`,
    skippedCompanyNames.size,
    `companies due to missing wikidataId.\n\n`
  )

  // await writeFile(
  //   resolve('output/spreadsheet-import.json'),
  //   JSON.stringify(companies, null, 2),
  //   { encoding: 'utf-8' }
  // )
}

if (isMainModule(import.meta.url)) {
  await main()
}
