import { Employees, Metadata, Turnover, Description } from '@prisma/client'
import { OptionalNullable } from '../../lib/type-utils'
import { CompanyListPayload, DefaultEconomyType } from '../types'
import { prisma } from '../../lib/prisma'
import { economyArgs, detailedCompanyArgs, companyListArgs } from '../args'
import { calculateEmissionChangeLastTwoYears } from '@/lib/company-emissions/companyEmissionsCalculator'
import { calculateFutureEmissionTrend } from '@/lib/company-emissions/companyEmissionsFutureTrendCalculator'
import {
  calculateEmissionAtCurrentYear,
  calculateWhenFutureTrendExceedsCarbonLaw,
  meetsParisGoal,
  sumOfExponentialTrendPath,
  sumOfLinearTrendPath,
} from '@/lib/parisKPICalculator'
import { Company, Emissions } from '@/types'

class CompanyService {
  async getAllCompaniesWithMetadata() {
    const companies = await prisma.company.findMany(companyListArgs)
    const processedCompanies = processMetadataAndAddCalculations(companies)
    return processedCompanies
  }

  async getAllCompaniesBySearchTerm(searchTerm: string) {
    const companies = await prisma.company.findMany({
      ...companyListArgs,
      where: { name: { contains: searchTerm } },
    })
    const processedCompanies = processMetadataAndAddCalculations(companies)
    return processedCompanies
  }

  async getCompanyWithMetadata(wikidataId: string): Promise<Company> {
    const company = await prisma.company.findFirstOrThrow({
      ...detailedCompanyArgs,
      where: {
        wikidataId,
      },
    })

    const [transformedCompany] = addParisAgreementKPIsToCompanies(
      addFutureEmissionsTrendSlope(
        addCompanyEmissionChange(
          addCalculatedTotalEmissions([transformMetadata(company)]),
        ),
      ),
    )

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

function processMetadataAndAddCalculations(companies: CompanyListPayload[]) {
  const transformedCompanies = companies.map(transformMetadata)

  const companiesWithCalculatedTotalEmissions =
    addCalculatedTotalEmissions(transformedCompanies)

  const companiesWithEmissionsChange = addCompanyEmissionChange(
    companiesWithCalculatedTotalEmissions,
  )

  const companiesWithFutureEmissionsTrendSlope = addFutureEmissionsTrendSlope(
    companiesWithEmissionsChange,
  )

  const companiesWithParisAgreementKPIs = addParisAgreementKPIsToCompanies(
    companiesWithFutureEmissionsTrendSlope,
  )

  return companiesWithParisAgreementKPIs
}

export function transformMetadata(data: any): any {
  if (Array.isArray(data)) {
    return data.map((item) => transformMetadata(item))
  } else if (data && typeof data === 'object') {
    const transformed = Object.entries(data).reduce(
      (acc, [key, value]) => {
        if (key === 'metadata' && Array.isArray(value)) {
          acc[key] = value[0] || null
        } else if (value instanceof Date) {
          acc[key] = value
        } else if (typeof value === 'object' && value !== null) {
          acc[key] = transformMetadata(value)
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
            ) ||
            scope3?.statedTotalEmissions?.total ||
            0
          const calculatedTotalEmissions =
            (scope1?.total ?? 0) + (scope2Total ?? 0) + scope3Total

          return {
            ...reportingPeriod,
            emissions: reportingPeriod.emissions && {
              ...reportingPeriod.emissions,
              scope2: scope2 && {
                ...scope2,
                calculatedTotalEmissions: scope2Total || 0,
              },
              scope3: scope3 && {
                ...scope3,
                calculatedTotalEmissions: scope3Total || 0,
              },
              calculatedTotalEmissions: calculatedTotalEmissions || 0,
            },
            metadata: reportingPeriod.metadata,
          }
        }),
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

function transformEmissionsForTrendCalculator(emissions: Emissions) {
  return {
    calculatedTotalEmissions: emissions.calculatedTotalEmissions,
    scope1: emissions.scope1 ? { total: emissions.scope1.total } : undefined,
    scope2: emissions.scope2
      ? {
          mb: emissions.scope2.mb,
          lb: emissions.scope2.lb ?? 0,
          unknown: emissions.scope2.unknown ?? null,
        }
      : null,
    scope3: emissions.scope3
      ? {
          calculatedTotalEmissions:
            emissions.scope3.calculatedTotalEmissions ?? null,
          statedTotalEmissions: emissions.scope3.statedTotalEmissions
            ? {
                total: emissions.scope3.statedTotalEmissions.total ?? null,
              }
            : undefined,
          categories: emissions.scope3.categories?.map((cat) => ({
            category: cat.category,
            total: cat.total ?? null,
          })),
        }
      : undefined,
    statedTotalEmissions: emissions.statedTotalEmissions?.total ?? null,
  }
}

function addFutureEmissionsTrendSlope(companies: Company[]) {
  return companies.map((company) => {
    const transformedCompany = {
      reportedPeriods: company.reportingPeriods.map((period) => ({
        year: new Date(period.endDate).getFullYear(),
        emissions: period.emissions
          ? transformEmissionsForTrendCalculator(period.emissions)
          : null,
      })),
      baseYear: company.baseYear,
    }

    const baseYear = transformedCompany.baseYear?.year
    const slope = calculateFutureEmissionTrend(
      transformedCompany.reportedPeriods,
      baseYear,
    )

    return {
      ...company,
      futureEmissionsTrendSlope: slope,
    }
  })
}

function addParisAgreementKPIsToCompanies(companies: Company[]) {
  const currentYear = new Date().getFullYear()
  return companies.map((company) => {
    if (!company.futureEmissionsTrendSlope) {
      return {
        ...company,
        meetsParisGoal: null,
        dateTrendExceedsCarbonLaw: null,
      }
    }

    const lastReportedPeriod = company.reportingPeriods[0]

    const lastReportedEmissions =
      lastReportedPeriod.emissions.calculatedTotalEmissions

    if (!lastReportedEmissions) {
      return {
        ...company,
        meetsParisGoal: null,
        dateTrendExceedsCarbonLaw: null,
      }
    }

    const emissionAtCurrentYear = calculateEmissionAtCurrentYear(
      company.futureEmissionsTrendSlope,
      lastReportedEmissions,
      new Date(lastReportedPeriod.startDate).getFullYear(),
      currentYear,
    )

    const sumOfLinearTrend = sumOfLinearTrendPath(
      company.futureEmissionsTrendSlope,
      emissionAtCurrentYear,
      currentYear,
    )

    const sumOfCarbonLaw = sumOfExponentialTrendPath(
      emissionAtCurrentYear,
      currentYear,
    )

    let meetsParis: boolean | null = null
    if (sumOfLinearTrend && sumOfCarbonLaw) {
      meetsParis = meetsParisGoal(sumOfLinearTrend, sumOfCarbonLaw)
    }

    const whenFutureTrendExceedsCarbonLaw =
      calculateWhenFutureTrendExceedsCarbonLaw(
        company.futureEmissionsTrendSlope,
        emissionAtCurrentYear,
        sumOfCarbonLaw,
        currentYear,
      )

    return {
      ...company,
      meetsParisGoal: meetsParis,
      dateTrendExceedsCarbonLaw: whenFutureTrendExceedsCarbonLaw,
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
