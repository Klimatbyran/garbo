import { Employees, Metadata, Turnover } from '@prisma/client'

import { OptionalNullable } from '../../lib/type-utils'
import { DefaultEconomyType } from '../types'
import { prisma } from '../../lib/prisma'
import { economyArgs, detailedCompanyArgs, companyListArgs } from '../args'

class CompanyService {
  async getAllCompaniesWithMetadata() {
    const companies = await prisma.company.findMany(companyListArgs)
    const transformedCompanies = addCompanyEmissionChange(addCalculatedTotalEmissions(
      companies.map(transformMetadata)
    ));
    console.log(transformedCompanies);
    return transformedCompanies
  }

  async getAllCompaniesBySearchTerm(searchTerm: string) {
    const companies = await prisma.company.findMany({...companyListArgs, where: {name: {contains: searchTerm}}})
    const transformedCompanies = addCompanyEmissionChange(addCalculatedTotalEmissions(
      companies.map(transformMetadata)
    ));
    return transformedCompanies
  }

  async getCompanyWithMetadata(wikidataId: string) {
    const company = await prisma.company.findFirstOrThrow({
      ...detailedCompanyArgs,
      where: {
        wikidataId,
      },
    })

    const [transformedCompany] = addCompanyEmissionChange(addCalculatedTotalEmissions([
      transformMetadata(company),
    ]))

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
      // Calculate total emissions for each reporting period
      // This allows comparing against the statedTotalEmissions provided by the company report
      .map((company) => ({
        ...company,
        reportingPeriods: company.reportingPeriods.map((reportingPeriod) => {
          const { scope1, scope2, scope3 } = reportingPeriod.emissions || {}
          const scope2Total = scope2?.mb ?? scope2?.lb ?? scope2?.unknown;
          const scope3Total = scope3?.categories.reduce((total, category) => category.total + total, 0) || scope3?.statedTotalEmissions?.total || 0;
          const calculatedTotalEmissions = (scope1?.total ?? 0) + (scope2Total ?? 0) + scope3Total

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
  return( companies.map((company) => {
    company.reportingPeriods.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
    company.reportingPeriods.map((period: any, index: number) => {
      if(index < company.reportingPeriods.length - 1) {
        let adjustedCurrentTotal = 0;
        let adjustedPreviousTotal = 0;
        const previousPeriod = company.reportingPeriods[index + 1];
        const { scope1: currentScope1, scope2: currentScope2, scope3: currentScope3 } = period.emissions || {};
        const { scope1: preivousScope1, scope2: preivousScope2, scope3: preivousScope3 } = previousPeriod.emissions || {};
        if(currentScope1 && preivousScope1) {
          adjustedCurrentTotal += currentScope1?.total ?? 0;
          adjustedPreviousTotal += preivousScope1?.total ?? 0;
        }
        if(currentScope2 && preivousScope2) {
          adjustedCurrentTotal += currentScope2?.mb ?? currentScope2?.lb ?? currentScope2?.unknown ?? 0;
          adjustedPreviousTotal += preivousScope2?.mb ?? preivousScope2?.lb ?? preivousScope2?.unknown ?? 0;
        }
        if(currentScope3 && preivousScope3) {
          if(currentScope3?.categories && preivousScope3?.categories && currentScope3?.categories.length > 0 && preivousScope3?.categories.length > 0) {
            currentScope3?.categories.forEach((currentCategory) => {
              const previousCategory = preivousScope3?.categories.find((category) => category.category === currentCategory.category);
              if(previousCategory) {
                adjustedCurrentTotal += currentCategory?.total ?? 0;
                adjustedPreviousTotal += previousCategory?.total ?? 0;
              }
            });
          } else if(currentScope3.statedTotalEmissions && preivousScope3.statedTotalEmissions) {
            adjustedCurrentTotal += currentScope3?.statedTotalEmissions ?? 0;
            adjustedPreviousTotal += preivousScope3?.statedTotalEmissions ?? 0;
          }
        }
        console.log(adjustedCurrentTotal);
        console.log(adjustedPreviousTotal);
        period.emissionsTrend = {
          absolute: period.emissions.calculatedTotalEmissions > 0 ? ((period.emissions.calculatedTotalEmissions - previousPeriod.emissions.calculatedTotalEmissions) / period.emissions.calculatedTotalEmissions * 100) : 0,
          adjusted: adjustedCurrentTotal > 0 ? ((adjustedCurrentTotal - adjustedPreviousTotal) / adjustedCurrentTotal * 100) : 0
        }
      } else {
        period.emissionsTrend = {
          absolute: null,
          adjusted: null
        }
      }
    });
    return company;
  }));
}