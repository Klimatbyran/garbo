import { Employees, Metadata, Turnover } from '@prisma/client'

import { OptionalNullable } from '../../lib/type-utils'
import { DefaultEconomyType } from '../types'
import { prisma } from '../../lib/prisma'
import { economyArgs, detailedCompanyArgs, companyListArgs } from '../args'

class CompanyService {
  async getAllCompaniesWithMetadata() {
    const companies = await prisma.company.findMany(companyListArgs)
    const transformedCompanies = addCalculatedTotalEmissions(
      companies.map(transformMetadata)
    )
    return transformedCompanies
  }

  async getCompanyWithMetadata(wikidataId: string) {
    const company = await prisma.company.findFirstOrThrow({
      ...detailedCompanyArgs,
      where: {
        wikidataId,
      },
    })

    const [transformedCompany] = addCalculatedTotalEmissions([
      transformMetadata(company),
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
    description?: string
    url?: string
    internalComment?: string
    tags?: string[]
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

export function transformMetadata(data: any): any {
  if (Array.isArray(data)) {
    return data.map((item) => transformMetadata(item))
  } else if (data && typeof data === 'object') {
    const transformed = Object.entries(data).reduce((acc, [key, value]) => {
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
    }, {} as Record<string, any>)

    return transformed
  }
  return data
}

export function addCalculatedTotalEmissions(companies: any[]) {
  return (
    companies
      // Calculate total emissions for each scope type
      .map((company) => ({
        ...company,
        reportingPeriods: company.reportingPeriods.map((reportingPeriod) => ({
          ...reportingPeriod,
          emissions: reportingPeriod.emissions
            ? {
                ...reportingPeriod.emissions,
                scope2:
                  (reportingPeriod.emissions?.scope2 && {
                    ...reportingPeriod.emissions.scope2,
                    calculatedTotalEmissions:
                      reportingPeriod.emissions.scope2.mb ??
                      reportingPeriod.emissions.scope2.lb ??
                      reportingPeriod.emissions.scope2.unknown,
                  }) ||
                  null,
                scope3:
                  (reportingPeriod.emissions?.scope3 && {
                    ...reportingPeriod.emissions.scope3,
                    calculatedTotalEmissions:
                      reportingPeriod.emissions.scope3.categories.some((c) =>
                        Boolean(c.metadata?.verifiedBy)
                      )
                        ? reportingPeriod.emissions.scope3.categories
                            .filter(
                              (category) =>
                                category.category !== 16 ||
                                Boolean(category.metadata?.verifiedBy)
                            )
                            .reduce(
                              (total, category) =>
                                isNumber(category.total)
                                  ? category.total + total
                                  : total,
                              0
                            )
                        : reportingPeriod.emissions.scope3.statedTotalEmissions
                            ?.total ?? 0,
                  }) ||
                  null,
              }
            : null,
          metadata: reportingPeriod.metadata,
        })),
      }))
      // Calculate total emissions for each reporting period
      // This allows comparing against the statedTotalEmissions provided by the company report
      // In cases where we find discrepancies between the statedTotalEmissions and the actual total emissions,
      // we should highlight this in the UI.
      .map((company) => ({
        ...company,
        reportingPeriods: company.reportingPeriods.map((reportingPeriod) => ({
          ...reportingPeriod,
          emissions: reportingPeriod.emissions
            ? {
                ...reportingPeriod.emissions,
                calculatedTotalEmissions:
                  // If either scope 1 and scope 2 have verification, then we use them for the total.
                  // Otherwise, we use the combined scope1And2 if it exists
                  (Boolean(
                    reportingPeriod.emissions?.scope1?.metadata?.verifiedBy
                  ) ||
                  Boolean(
                    reportingPeriod.emissions?.scope2?.metadata?.verifiedBy
                  )
                    ? (reportingPeriod.emissions?.scope1?.total || 0) +
                      (reportingPeriod.emissions?.scope2
                        ?.calculatedTotalEmissions || 0)
                    : reportingPeriod.emissions?.scope1And2?.total || 0) +
                  (reportingPeriod.emissions?.scope3
                    ?.calculatedTotalEmissions || 0),
              }
            : null,
        })),
      }))
  )
}

function isNumber(n: unknown): n is number {
  return Number.isFinite(n)
}
