import 'dotenv/config'
import ExcelJS from 'exceljs'
import { resolve } from 'path'
import { z } from 'zod'

import { CompanyInput, ReportingPeriodInput } from './import'
import { isMainModule } from './utils'
import { resetDB } from '../src/lib/dev-utils'
import { getReportingPeriodDates } from '../src/lib/reportingPeriodDates'

const workbook = new ExcelJS.Workbook()
await workbook.xlsx.readFile(resolve('src/data/Company GHG data.xlsx'))

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
    email: 'hej@klimatkollen.se',
    token: ENV.API_TOKENS.garbo,
  },
  alex: {
    email: 'alex@klimatkollen.se',
    token: ENV.API_TOKENS.alex,
  },
}

const verifiedMetadata = {
  comment: 'Import from spreadsheet with verified data',
}

function getCompanyBaseFacts() {
  const sheet = workbook.getWorksheet('Overview')!
  const headerRow = 2
  const headers = getSheetHeaders({ sheet, row: headerRow })

  return sheet
    .getSheetValues()
    .slice(headerRow + 1) // Skip header
    .reduce<
      {
        wikidataId: string
        name: string
        internalComment?: string
        tags?: string[]
      }[]
    >((rowValues, row, i) => {
      if (!row) return rowValues

      const columns = headers.reduce((acc, header, i) => {
        const index = i + 1
        acc[header!.toString()] = row[index]?.result || row[index]
        return acc
      }, {})

      const {
        'Wiki ID': wikidataId,
        Company: name,
        Batch,
        'General Comment': internalComment,
      } = columns as any

      // Assuming the MVP batch is the first 150 companies in the list
      const companySize = i < 150 ? 'large-cap' : 'mid-cap'
      const tags = [
        companySize,
        ...(Batch.toLowerCase() === 'statlig' ? ['state-owned'] : []),
      ]

      rowValues.push({
        name,
        wikidataId,
        tags,
        internalComment,
      })

      return rowValues
    }, [])
}

function getReportingPeriods(
  wantedCompanies: {
    wikidataId: string
    name: string
  }[],
  years: number[]
): Record<string, ReportingPeriodInput[]> {
  const reportingPeriodsByCompany: Record<string, ReportingPeriodInput[]> = {}

  // For each year, get the reporting period of each company
  for (const year of years) {
    const sheet = workbook.getWorksheet(year.toString())
    if (!sheet) continue
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
          Batch: batch,
          Company: name,
          [`URL ${year}`]: reportURL,
          'Scope 1': scope1Total,
          'Scope 2 (LB)': scope2LB,
          'Scope 1+2': scope1And2Total,
          'Scope 2 (MB)': scope2MB,
          'Scope 3 (total)': scope3StatedTotal,
          Total: statedTotal,
          'Biogenic (outside of scopes)': biogenic,
          Turnover: turnover,
          Currency: currency,
          'No of Employees': employees,
          Unit: employeesUnit,
          Comment: comment,
        } = wantedColumns as any

        const company = wantedCompanies.find((c) => {
          // NOTE: Figure out why some companies are missing their names.
          const companyName = String(c.name)?.trim()?.toLowerCase()
          return companyName === name.trim().toLowerCase()

          // NOTE: This can be useful to verify we don't have any name mis-matches.
          // if (companyName) {
          //   return name.trim().toLowerCase() === companyName
          // } else {
          //   console.log({ cDotName: c.name, companyName, name })
          //   // console.log(`comparing ${name} and ${c.name} for`, reportURL)
          //   return false
          // }
        })

        if (!company) {
          if (batch.trim().toUpperCase() !== 'MVP') {
            console.error(`${year}: Company ${name} was not included.`)
          }
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

        const scope1And2 = {
          ...(Number.isFinite(scope1And2Total)
            ? {
                total: scope1And2Total,
              }
            : {}),
        }

        const categories = Array.from({ length: 15 }, (_, i) => i + 1)
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
          ...(categories.length ? { categories } : {}),
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
          ...(Object.keys(scope1And2).length ? { scope1And2 } : {}),
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

        const { wikidataId: companyId } = company

        const [periodStart, periodEnd] = getReportingPeriodDates(year, 1, 12)

        // TODO: Save the comment for each reporting period, and add it as part of the
        const reportingPeriod = {
          companyId,
          startDate: new Date(periodStart),
          endDate: new Date(periodEnd),
          comment: comment?.trim(),
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
            `for "${name}" due to missing emissions and economy data`,
            comment ? { comment: reportingPeriod.comment } : ''
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
  const baseFacts = getCompanyBaseFacts()

  const rawCompanies: Record<
    string,
    {
      wikidataId: string
      name: string
    }
  > = {}

  for (const facts of baseFacts) {
    if (
      rawCompanies[facts.wikidataId] &&
      rawCompanies[facts.wikidataId].name !== facts.name
    ) {
      console.error(
        `Duplicate wikidataId for ${facts.name} and ${
          rawCompanies[facts.wikidataId].name
        } in the "Overview" tab`
      )
      continue
    }

    rawCompanies[facts.wikidataId] = {
      ...rawCompanies[facts.wikidataId],
      ...facts,
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
      reportingPeriods,
    })
  }

  return companies
}

export async function updateCompanies(companies: CompanyInput[]) {
  for (const company of companies) {
    const { wikidataId, name, tags, internalComment, reportingPeriods } =
      company

    await postJSON(
      `http://localhost:3000/api/companies`,
      {
        wikidataId,
        name,
        tags,
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

async function postJSON(
  url: string,
  body: any,
  user: keyof typeof USERS = 'garbo'
) {
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

const API_BASE_URL = 'https://api.klimatkollen.se/api/companies'

async function ensureCompaniesExist(companies: CompanyInput[]) {
  const apiCompanies = await fetch(API_BASE_URL).then((res) => res.json())

  return Promise.all(
    companies.map((company) => {
      if (
        apiCompanies.some(({ wikidataId }) => wikidataId === company.wikidataId)
      ) {
        return
      }

      return postJSON(
        `http://localhost:3000/api/companies`,
        {
          wikidataId: company.wikidataId,
          name: company.name,
          metadata: verifiedMetadata,
        },
        'alex'
      ).then(async (res) => {
        if (!res.ok) {
          const body = await res.text()
          console.error(res.status, res.statusText, company.wikidataId, body)
        }
      })
    })
  )
}

async function main() {
  const companies = getCompanyData(range(2015, 2023).reverse())

  await resetDB()

  console.log('Ensure companies exist...')
  await ensureCompaniesExist(companies)

  console.log('Updating companies based on spreadsheet data...')
  await updateCompanies(companies)

  console.log(
    `\n\n✅ Imported`,
    companies.length,
    `and skipped`,
    skippedCompanyNames.size,
    `companies.\n\n`
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
