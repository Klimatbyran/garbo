import 'dotenv/config'
import ExcelJS from 'exceljs'
import { resolve } from 'path'

import apiConfig from '../src/config/api'
import { CompanyInput, ReportingPeriodInput } from './import'
import { isMainModule } from './utils'
import { getReportingPeriodDates } from '../src/lib/reportingPeriodDates'
import { readFile, writeFile } from 'fs/promises'
import { resetDB } from '../src/lib/dev-utils'

const workbook = new ExcelJS.Workbook()
await workbook.xlsx.readFile(resolve('data/Klimatkollen_ Company GHG data.xlsx'))

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

export const USERS = {
  garbo: {
    email: 'hej@klimatkollen.se',
    token: await getApiToken('garbo'),
  },
  alex: {
    email: 'alex@klimatkollen.se',
    token: await getApiToken('alex'),
  },
}

const verifiedMetadata = {
  comment: 'Import verified data from spreadsheet',
}

async function getApiToken(user: string) {
  const response = await fetch(`${apiConfig.baseURL}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: user,
      client_secret: apiConfig.secret,
    }),
  })

  return (await response.json()).token
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
export function range(start: number, end: number) {
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
    const {
      wikidataId,
      name,
      tags,
      internalComment,
      reportingPeriods,
      description,
      goals,
      initiatives,
    } = company

    await postJSON(
      `${apiConfig.baseURL}/companies`,
      {
        wikidataId,
        name,
        description,
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
    const reportingPeriodArgs = [
      `${apiConfig.baseURL}/companies/${wikidataId}/reporting-periods`,
      {reportingPeriods},
      'alex',
    ] as const

    await postJSON(...reportingPeriodArgs).then(async (res) => {
      if (!res.ok) {
        const body = await res.text()
        console.error(res.status, res.statusText, wikidataId, body)
      }
    })

    if (goals?.length) {
      await postJSON(
        `${apiConfig.baseURL}/companies/${wikidataId}/goals`,
        {
          goals,
          metadata: {
            ...goals[0].metadata,
            verifiedBy: undefined,
            user: undefined,
          },
        },
        'garbo'
      ).then(async (res) => {
        if (!res.ok) {
          const body = await res.text()
          console.error(res.status, res.statusText, wikidataId, body)
        }
      })
    }

    if (initiatives?.length) {
      await postJSON(
        `${apiConfig.baseURL}/companies/${wikidataId}/initiatives`,
        {
          initiatives,
          metadata: {
            ...initiatives[0].metadata,
            verifiedBy: undefined,
            user: undefined,
          },
        },
        'garbo'
      ).then(async (res) => {
        if (!res.ok) {
          const body = await res.text()
          console.error(res.status, res.statusText, wikidataId, body)
        }
      })
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

  //await resetDB()

  const apiCompaniesFile = resolve(
    'data/companies.json'
  )

  const existing = await readFile(apiCompaniesFile, { encoding: 'utf-8' }).then(
    JSON.parse
  )

  // await writeFile(apiCompaniesFile, JSON.stringify(existing), {
  //   encoding: 'utf-8',
  // })

  // process.exit(0)

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
  /*console.dir(
    Array.from(uniqueSheets.difference(uniqueAPI)).map(
      (id) => companies.find((c) => c.wikidataId === id).name + ' - ' + id
    )
  )*/

  // ## DÖLJ DESSA från API:et
  const HIDDEN_FROM_API = new Set([
    'Q22629259', // GARO
    'Q37562781', // GARO
    'Q489097', // Ernst & Young
    'Q10432209', // Prisma Properties
    'Q5168854', // Copperstone Resources AB
    'Q115167497', // Specialfastigheter
    'Q549624', // RISE AB
    'Q34', // Swedish Logistic Property AB,

    // OLD pages:

    'Q8301325', // SJ
    'Q112055015', // BONESUPPORT
    'Q97858523', // Almi
    'Q2438127', // Dynavox
    'Q117352880', // BioInvent
    'Q115167497', // Specialfastigheter
  ])

  console.log('HIDDEN FROM API')
  /*console.dir(
    Array.from(HIDDEN_FROM_API).map(
      (id) => existing.find((c) => c.wikidataId === id).name + ' - ' + id
    )
  )*/

  const REMAINING_UNIQUE_IN_API =
    existsInAPIButNotInSheets.difference(HIDDEN_FROM_API)
  console.log('REMAINING_UNIQUE_IN_API')
  console.dir(
    Array.from(REMAINING_UNIQUE_IN_API).map(
      (id) => existing.find((c) => c.wikidataId === id).name + ' - ' + id
    )
  )

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
