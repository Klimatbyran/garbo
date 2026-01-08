import { Employees, Metadata, Turnover, Description } from '@prisma/client'
import { OptionalNullable } from '../../lib/type-utils'
import { DefaultEconomyType } from '../types'
import { prisma } from '../../lib/prisma'
import { economyArgs, detailedCompanyArgs, companyListArgs } from '../args'
import {
  calculateEmissionChangeLastTwoYears,
  calculateScope2Total,
  calculateScope3Total,
  calculatedTotalEmissions,
} from '@/lib/company-emissions/companyEmissionsCalculator'
import { calculateFutureEmissionTrend } from '@/lib/company-emissions/companyEmissionsFutureTrendCalculator'

class CompanyService {
  async getAllCompaniesWithMetadata(authenticated: boolean = false) {
    const companies = await prisma.company.findMany(companyListArgs)
    const transformedCompanies = addCalculatedTotalEmissions(
      companies.map((data) => transformMetadata(data, !authenticated)),
    )
    return transformedCompanies
  }

  async getAllCompaniesBySearchTerm(
    searchTerm: string,
    authenticated: boolean = false,
  ) {
    const companies = await prisma.company.findMany({
      ...companyListArgs,
      where: { name: { contains: searchTerm } },
    })
    const transformedCompanies = addCalculatedTotalEmissions(
      companies.map((data) => transformMetadata(data, !authenticated)),
    )
    return transformedCompanies
  }

  async getCompanyWithMetadata(
    wikidataId: string,
    authenticated: boolean = false,
  ) {
    const company = await prisma.company.findFirstOrThrow({
      ...detailedCompanyArgs,
      where: {
        wikidataId,
      },
    })

    const [transformedCompany] = addCalculatedTotalEmissions([
      transformMetadata(company, !authenticated),
    ])

    return transformedCompany
  }

  async getCompany(wikidataId: string) {
    return prisma.company.findFirstOrThrow({
      where: { wikidataId },
      include: { baseYear: true },
    })
  }

  async upsertCompany({
    wikidataId,
    ...data
  }: {
    wikidataId: string
    name: string
    url?: string
    logoUrl?: string
    internalComment?: string
    tags?: string[]
    lei?: string
  }) {
    return prisma.company.upsert({
      where: {
        wikidataId,
      },
      create: {
        ...data,
        wikidataId,
      },
      // TODO: Should we allow updating the wikidataId?
      // Probably yes from a business perspective, but that also means we need to update all related records too.
      // Updating the primary key can be tricky, especially with backups using the old primary key no longer being compatible.
      // This might be a reason why we shouldn't use wikidataId as our primary key in the DB.
      // However, no matter what, we could still use wikidataId in the API and in the URL structure.
      update: { ...data },
    })
  }

  async deleteCompany(wikidataId: string) {
    return prisma.company.delete({ where: { wikidataId } })
  }

  async upsertEconomy({
    economyId,
    reportingPeriodId,
  }: {
    economyId: string
    reportingPeriodId: string
  }) {
    return prisma.economy.upsert({
      where: { id: economyId },
      update: {},
      create: {
        reportingPeriod: {
          connect: {
            id: reportingPeriodId,
          },
        },
      },
      ...economyArgs,
    })
  }

  async upsertDescription({
    description,
    companyId,
    metadataId,
  }: {
    description: Omit<Description, 'id' | 'companyId'> & {
      id?: string | undefined
    }
    companyId: string
    metadataId?: string
  }) {
    return prisma.description.upsert({
      where: { id: description.id ?? '' },
      create: {
        text: description.text,
        language: description.language,
        company: {
          connect: { wikidataId: companyId },
        },
        metadata: {
          connect: { id: metadataId },
        },
      },
      update: {
        text: description.text,
        language: description.language,
        metadata: {
          connect: { id: metadataId },
        },
      },
    })
  }

  async upsertTurnover({
    economy,
    metadata,
    turnover,
  }: {
    economy: DefaultEconomyType
    metadata: Metadata
    turnover: Partial<
      Omit<Turnover, 'id' | 'metadataId' | 'unit' | 'economyId'>
    >
  }) {
    return prisma.turnover.upsert({
      where: { id: economy.turnover?.id ?? '' },
      create: {
        ...turnover,
        metadata: {
          connect: { id: metadata.id },
        },
        economy: {
          connect: { id: economy.id },
        },
      },
      update: {
        ...turnover,
        metadata: {
          connect: { id: metadata.id },
        },
      },
      select: { id: true },
    })
  }

  async upsertEmployees({
    economy,
    employees,
    metadata,
  }: {
    economy: DefaultEconomyType
    employees: OptionalNullable<
      Omit<Employees, 'id' | 'metadataId' | 'economyId'>
    >
    metadata: Metadata
  }) {
    const existingEmployeesId = economy.employees?.id

    return prisma.employees.upsert({
      where: { id: existingEmployeesId ?? '' },
      create: {
        ...employees,
        metadata: {
          connect: { id: metadata.id },
        },
        economy: {
          connect: { id: economy.id },
        },
      },
      update: {
        ...employees,
        metadata: {
          connect: { id: metadata.id },
        },
      },
      select: { id: true },
    })
  }
}

export const companyService = new CompanyService()

export function transformMetadata(data: any, onlyIncludeVerified = false): any {
  if (Array.isArray(data)) {
    return data.map((item) => transformMetadata(item, onlyIncludeVerified))
  } else if (data && typeof data === 'object') {
    const transformed = Object.entries(data).reduce(
      (acc, [key, value]) => {
        if (key === 'metadata' && Array.isArray(value)) {
          if (onlyIncludeVerified) {
            acc[key] = { verified: value[0].verifiedBy !== null }
          } else {
            acc[key] = { ...value[0], verified: value[0].verifiedBy !== null }
          }
        } else if (value instanceof Date) {
          acc[key] = value
        } else if (typeof value === 'object' && value !== null) {
          acc[key] = transformMetadata(value, onlyIncludeVerified)
        } else {
          acc[key] = value
        }
        return acc
      },
      {} as Record<string, any>,
    )

    return transformed
  }
  return data
}

export function addCalculatedTotalEmissions(companies: any[]) {

  return (
    companies
      // Calculate total emissions for each reporting period
      // This allows comparing against the statedTotalEmissions provided by the company report
      .map((company) => ({
        ...company,
        reportingPeriods: company.reportingPeriods.map((reportingPeriod) => {
          const { scope1, scope2, scope3 } = reportingPeriod.emissions || {}
          const scope2Total = scope2?.mb ?? scope2?.lb ?? scope2?.unknown
          const scope3Total =
            scope3?.categories.reduce(
              (total, category) => category.total + total,
              0,
            ) || 0

          const calculatedTotalEmissions =
            (scope1?.total ?? 0) + (scope2Total ?? 0) + (scope3Total ?? 0)
          return {
            ...reportingPeriod,
            emissions: reportingPeriod.emissions && {
              ...reportingPeriod.emissions,
              scope2: scope2 && {
                ...scope2,
                calculatedTotalEmissions: scope2Total,
              },
              scope3: scope3 && {
                ...scope3,
                calculatedTotalEmissions: scope3Total,
              },
              calculatedTotalEmissions: calculatedTotalEmissions || 0,
            },
            metadata: reportingPeriod.metadata,
          }
        }),

        futureEmissionsTrendSlope: company.futureEmissionsTrendSlope ?? null,
      }))
  )
}

export function addCompanyEmissionChange(companies: any[]) {
  return companies.map((company) => {
    return {
      ...company,
      reportingPeriods: addEmissionTrendsToReportingPeriods(
        sortReportingPeriodsByEndDate(company.reportingPeriods),
      ),
    }
  })
}

export function addFutureEmissionsTrendSlope(companies: any[]) {
  return companies.map((company) => {
    try {
      // Ensure we have reporting periods
      if (!company.reportingPeriods || company.reportingPeriods.length === 0) {
        return {
          ...company,
          futureEmissionsTrendSlope: null,
        }
      }

      const transformedCompany = {
        reportedPeriods: company.reportingPeriods.map((period) => ({
          year: new Date(period.endDate).getFullYear(),
          emissions: period.emissions,
        })),
        baseYear: company.baseYear,
      }

      const baseYear = transformedCompany.baseYear?.year

      const slope = calculateFutureEmissionTrend(
        transformedCompany.reportedPeriods,
        baseYear,
      )

      // Ensure we always return a valid value (number or null)
      const validSlope = typeof slope === 'number' ? slope : null

      return {
        ...company,
        futureEmissionsTrendSlope: validSlope,
      }
    } catch (error) {
      console.error(
        'Error calculating future emissions trend slope for company:',
        company.wikidataId,
        error,
      )
      return {
        ...company,
        futureEmissionsTrendSlope: null,
      }
    }
  })
}

function sortReportingPeriodsByEndDate(reportingPeriods: any[]) {
  return reportingPeriods.sort(
    (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
  )
}

function addEmissionTrendsToReportingPeriods(periods: any[]) {
  periods.forEach((period: any, index: number) => {
    if (index < periods.length - 1) {
      const previousPeriod = periods[index + 1]
      period.emissionsChangeLastTwoYears = calculateEmissionChangeLastTwoYears(
        period,
        previousPeriod,
      )
    } else {
      period.emissionsChangeLastTwoYears = {
        absolute: null,
        adjusted: null,
      }
    }
  })
  return periods
}
