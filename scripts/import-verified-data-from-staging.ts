import apiConfig from '../src/config/api'
import { removeDuplicates } from './remove-duplicate-emissions'

//BASE URL OF THE ENV YOU WANT TO APPLY THE VERIFIED DATA FROM
const PROD_BASE_URL = 'https://api.klimatkollen.se/api'

type VerifiedBy = { name: string } | null
interface Metadata {
  verifiedBy: VerifiedBy
}

interface EmissionCategory {
  category: number
  total: number
  unit: string
  metadata: Metadata
}

interface Scope {
  total?: number
  unit: string
  metadata: Metadata
  mb?: number
  lb?: number
  unknown?: number
  calculatedTotalEmissions?: number
  categories?: EmissionCategory[]
}

interface EconomyField {
  value: number
  unit: string
  currency?: string
  metadata: Metadata
}

interface ReportingPeriod {
  companyId: string
  startDate: string
  endDate: string
  reportURL: string
  emissions: {
    calculatedTotalEmissions: number
    scope1: Scope | null
    scope2: Scope | null
    scope3: {
      calculatedTotalEmissions: number
      metadata: Metadata
      statedTotalEmissions: Scope | null
      categories: EmissionCategory[] | null
    }
    scope1And2: Scope | null
    biogenic: Scope | null
    statedTotalEmissions: Scope | null
  }
  economy: {
    employees: EconomyField | null
    turnover: EconomyField | null
  }
}

async function getApiToken(secret: string) {
  const response = await fetch(`${apiConfig.baseURL}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: 'garbo',
      client_secret: secret,
    }),
  })

  return (await response.json()).token
}

async function getCompanies() {
  const response = await fetch(`${PROD_BASE_URL}/companies`)

  if (!response.ok) {
    throw new Error(`Failed to fetch companies: ${response.statusText}`)
  }

  return await response.json()
}

function filterObjectsWithVerifiedBy(
  companyWikidataId: string,
  reportingPeriods: ReportingPeriod[]
) {
  return reportingPeriods.map((period) => {
    const { emissions, economy } = period
    const reportingPeriod: any = {}
    reportingPeriod.companyId = companyWikidataId
    reportingPeriod.startDate = period.startDate
    reportingPeriod.endDate = period.endDate
    reportingPeriod.reportURL = period.reportURL ?? ''

    if (emissions) {
      // Remove scope1 if metadata.verifiedBy is null
      if (emissions?.scope1 && emissions.scope1.metadata.verifiedBy) {
        if (!reportingPeriod.emissions) {
          reportingPeriod.emissions = {}
        }
        reportingPeriod.emissions.scope1 = emissions.scope1
        reportingPeriod.emissions.scope1.verified = true
      }

      // Remove scope2 if metadata.verifiedBy is null
      if (emissions?.scope2 && emissions.scope2.metadata.verifiedBy) {
        if (!reportingPeriod.emissions) {
          reportingPeriod.emissions = {}
        }
        reportingPeriod.emissions.scope2 = emissions.scope2
        if (reportingPeriod.emissions.scope2.mb === null) {
          reportingPeriod.emissions.scope2.mb = 0
        }
        if (reportingPeriod.emissions.scope2.lb === null) {
          reportingPeriod.emissions.scope2.lb = 0
        }
        if (reportingPeriod.emissions.scope2.unknown === null) {
          reportingPeriod.emissions.scope2.unknown = 0
        }
        reportingPeriod.emissions.scope2.verified = true
      }

      // Remove scope3.statedTotalEmissions if metadata.verifiedBy is null
      if (
        emissions?.scope3?.statedTotalEmissions &&
        emissions.scope3?.statedTotalEmissions.metadata.verifiedBy
      ) {
        if (!reportingPeriod.emissions) {
          reportingPeriod.emissions = {}
        }
        if (!reportingPeriod.emissions.scope3) {
          reportingPeriod.emissions.scope3 = {}
        }
        reportingPeriod.emissions.scope3.statedTotalEmissions =
          emissions.scope3.statedTotalEmissions
        reportingPeriod.emissions.scope3.statedTotalEmissions.verified = true
      }

      // Remove scope1And2 if metadata.verifiedBy is null
      if (emissions?.scope1And2 && emissions.scope1And2.metadata.verifiedBy) {
        if (!reportingPeriod.emissions) {
          reportingPeriod.emissions = {}
        }
        reportingPeriod.emissions.scope1And2 = emissions.scope1And2
        reportingPeriod.emissions.scope1And2.verified = true
      }

      // Remove biogenic if metadata.verifiedBy is null
      if (emissions?.biogenic && emissions.biogenic.metadata.verifiedBy) {
        if (!reportingPeriod.emissions) {
          reportingPeriod.emissions = {}
        }
        reportingPeriod.emissions.biogenic = emissions.biogenic
        reportingPeriod.emissions.biogenic.verified = true
      }

      // Remove emissions.statedTotalEmissions if metadata.verifiedBy is null
      if (
        emissions?.statedTotalEmissions &&
        emissions.statedTotalEmissions.metadata.verifiedBy
      ) {
        if (!reportingPeriod.emissions) {
          reportingPeriod.emissions = {}
        }
        reportingPeriod.emissions.statedTotalEmissions =
          emissions.statedTotalEmissions
        reportingPeriod.emissions.statedTotalEmissions.verified = true
      }

      // Remove categories inside scope3.categories where metadata.verifiedBy is null
      if (emissions?.scope3?.categories) {
        if (!reportingPeriod.emissions) {
          reportingPeriod.emissions = {}
        }
        if (!reportingPeriod.emissions.scope3) {
          reportingPeriod.emissions.scope3 = {}
        }
        if (!reportingPeriod.emissions.scope3.categories) {
          reportingPeriod.emissions.scope3.categories = []
        }
        reportingPeriod.emissions.scope3.categories =
          emissions.scope3.categories.filter(
            (category) => category.metadata.verifiedBy
          )
        reportingPeriod.emissions.scope3.categories.map(
          (category) => (category.verified = true)
        )
      }
    }
    if (economy) {
      // Remove employees if metadata.verifiedBy is null
      if (
        economy?.employees &&
        economy.employees.metadata.verifiedBy &&
        economy.employees.value !== null
      ) {
        if (!reportingPeriod.economy) {
          reportingPeriod.economy = {}
        }
        reportingPeriod.economy.employees = economy.employees
        if (reportingPeriod.economy.employees.unit === null)
          reportingPeriod.economy.employees.unit = 'FTE'

        reportingPeriod.economy.employees.verified = true
      }

      // Remove turnover if metadata.verifiedBy is null
      if (economy?.turnover && economy.turnover.metadata.verifiedBy) {
        if (!reportingPeriod.economy) {
          reportingPeriod.economy = {}
        }
        reportingPeriod.economy.turnover = economy.turnover
        reportingPeriod.economy.turnover.verified = true
      }
    }

    return reportingPeriod
  })
}

async function pushVerfiedData(companies: any[]) {
  let processedCompanies = 0
  const token = await getApiToken(apiConfig.secret)
  for (const company of companies) {
    company.wikidataId = translateCompanyId(company.wikidataId)
    const filteredReportingPeriods = filterObjectsWithVerifiedBy(
      company.wikidataId,
      company.reportingPeriods
    )
    const response = await postReportingPeriodUpdate(
      company.wikidataId,
      token,
      filteredReportingPeriods
    )
    if (!response.ok) {
      console.error(
        `Failed to push verified data for company ${company.wikidataId}: ${response.statusText}`
      )
      if (response.status === 400) {
        console.log(
          JSON.stringify({ reportingPeriods: filteredReportingPeriods })
        )
      } else {
        console.log(`Created missing company ${company.wikidataId}`)
        await createMissingCompany(company.wikidataId, company.name)
        console.log(`Retry pushing data`)
        const retry = await postReportingPeriodUpdate(
          company.wikidataId,
          token,
          filteredReportingPeriods
        )
        if (!retry.ok) {
          console.error(
            `Failed to push verified data for company ${company.wikidataId}: ${retry.statusText}`
          )
        } else {
          processedCompanies++
        }
      }
    } else {
      processedCompanies++
    }
  }

  console.log(`Processed ${processedCompanies} companies`)
}

async function postReportingPeriodUpdate(
  wikidataId: string,
  token: string,
  filteredReportingPeriods: any[]
) {
  const response = await fetch(
    `${apiConfig.baseURL}/companies/${wikidataId}/reporting-periods`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reportingPeriods: filteredReportingPeriods }),
    }
  )
  return response
}

async function createMissingCompany(wikidataId: string, name: string) {
  const token = await getApiToken(apiConfig.secret)
  await fetch(`${apiConfig.baseURL}/companies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ wikidataId, name }),
  })
}

function translateCompanyId(wikidataId) {
  const translationRecord: Record<string, string> = {
    Q115167261: 'Q11964084',
    Q38168829: 'Q132103736',
    Q131412873: 'Q134350209',
    Q131394677: 'Q134354693',
    Q131424920: 'Q10432209',
    Q131426217: 'Q134395529',
    Q5318875: 'Q2438127',
    Q10397672: 'Q97858523',
  }
  if (translationRecord[wikidataId]) {
    return translationRecord[wikidataId]
  }
  return wikidataId
}

async function main() {
  removeDuplicates()
  const companies = await getCompanies()
  console.log(companies.length)
  await pushVerfiedData(companies)
}

main()
