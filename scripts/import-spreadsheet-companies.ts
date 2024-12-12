import 'dotenv/config'
import ExcelJS from 'exceljs'
import { resolve } from 'path'

import apiConfig from '../src/config/api'
import { CompanyInput, ReportingPeriodInput } from './import'
import { isMainModule } from './utils'
import { getReportingPeriodDates } from '../src/lib/reportingPeriodDates'
import { readFile } from 'fs/promises'

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

const { baseURL, tokens } = apiConfig

const TOKENS = tokens.reduce<{ garbo: string; alex: string }>(
  (tokens, token) => {
    const [name] = token.split(':')
    tokens[name] = token
    return tokens
  },
  {} as any
)

const USERS = {
  garbo: {
    email: 'hej@klimatkollen.se',
    token: TOKENS.garbo,
  },
  alex: {
    email: 'alex@klimatkollen.se',
    token: TOKENS.alex,
  },
}

const verifiedMetadata = {
  comment: 'Import verified data from spreadsheet',
}

function getCompanyBaseFacts() {
  const sheet = workbook.getWorksheet('import')!
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
          // console.log(
          //   'Skipping',
          //   year,
          //   `for "${name}" due to missing emissions and economy data`,
          //   comment ? { comment: reportingPeriod.comment } : ''
          // )
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
      tags: string[]
      internalComment?: string
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
      ...rawCompanies[wikidataId],
      reportingPeriods,
    })
  }

  return companies
}

export async function upsertCompanies(companies: CompanyInput[]) {
  for (const company of companies) {
    const { wikidataId, name, tags, internalComment, reportingPeriods } =
      company

    await postJSON(
      `${baseURL}/companies`,
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
          `${baseURL}/companies/${wikidataId}/${reportingPeriod.endDate.getFullYear()}/emissions`,
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
          `${baseURL}/companies/${wikidataId}/${reportingPeriod.endDate.getFullYear()}/economy`,
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

async function main() {
  const companies = getCompanyData(range(2015, 2023).reverse())

  const existing = await readFile(
    resolve('src/data/2024-12-11-2301-garbo-companies.json'),
    { encoding: 'utf-8' }
  ).then(JSON.parse)

  const uniqueAPI = new Set<string>(existing.map((c) => c.wikidataId))
  const uniqueSheets = new Set(companies.map((c) => c.wikidataId))

  const existsInAPIButNotInSheets = uniqueAPI.difference(uniqueSheets)

  console.log('exists in API but not in sheets')
  console.dir(
    Array.from(existsInAPIButNotInSheets).map(
      (id) => existing.find((c) => c.wikidataId === id).name + ' - ' + id
    )
  )
  console.log('exists in sheets but not in api')
  console.dir(
    Array.from(uniqueSheets.difference(uniqueAPI)).map(
      (id) => companies.find((c) => c.wikidataId === id).name + ' - ' + id
    )
  )

  process.exit(0)

  console.log('Upserting companies based on spreadsheet data...')
  await upsertCompanies(companies)

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
