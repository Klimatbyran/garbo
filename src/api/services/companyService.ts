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

/**
 * Calculates and adds total emissions for each company's reporting periods
 * 
 * This function:
 * 1. Calculates total emissions for each scope type (scope1, scope2, scope3)
 * 2. Calculates the total emissions across all scopes for each reporting period
 * 
 * @param companies Array of company data with reporting periods
 * @returns Companies with calculated emission totals
 */
export function addCalculatedTotalEmissions(companies: any[]) {
  return companies.map(company => {
    // Process each company
    const updatedCompany = {
      ...company,
      reportingPeriods: company.reportingPeriods.map(reportingPeriod => {
        // Skip processing if no emissions data
        if (!reportingPeriod.emissions) {
          return {
            ...reportingPeriod,
            emissions: null,
            metadata: reportingPeriod.metadata
          };
        }

        // Process scope2 emissions
        const scope2WithTotal = reportingPeriod.emissions.scope2 
          ? {
              ...reportingPeriod.emissions.scope2,
              calculatedTotalEmissions: calculateScope2Total(reportingPeriod.emissions.scope2)
            }
          : null;

        // Process scope3 emissions
        const scope3WithTotal = reportingPeriod.emissions.scope3
          ? {
              ...reportingPeriod.emissions.scope3,
              calculatedTotalEmissions: calculateScope3Total(reportingPeriod.emissions.scope3)
            }
          : null;

        // Calculate total emissions across all scopes
        const totalEmissions = calculateTotalEmissions(
          reportingPeriod.emissions.scope1,
          scope2WithTotal,
          scope3WithTotal,
          reportingPeriod.emissions.scope1And2
        );

        return {
          ...reportingPeriod,
          emissions: {
            ...reportingPeriod.emissions,
            scope2: scope2WithTotal,
            scope3: scope3WithTotal,
            calculatedTotalEmissions: totalEmissions
          },
          metadata: reportingPeriod.metadata
        };
      })
    };

    return updatedCompany;
  });
}

/**
 * Calculates the total emissions for Scope 2
 */
export function calculateScope2Total(scope2: any): number {
  return scope2.mb ?? scope2.lb ?? scope2.unknown ?? 0;
}

/**
 * Calculates the total emissions for Scope 3
 */
export function calculateScope3Total(scope3: any): number {
  // If any category has verification, sum up all categories (except unverified category 16)
  if (scope3.categories.some(c => Boolean(c.metadata?.verifiedBy))) {
    return scope3.categories
      .filter(category => 
        category.category !== 16 || Boolean(category.metadata?.verifiedBy)
      )
      .reduce((total, category) => 
        isNumber(category.total) ? category.total + total : total, 
        0
      );
  }
  
  // Otherwise use the stated total emissions
  return scope3.statedTotalEmissions?.total ?? 0;
}

/**
 * Calculates the total emissions across all scopes
 */
export function calculateTotalEmissions(
  scope1: any, 
  scope2: any, 
  scope3: any,
  scope1And2: any
): number {
  let scope1And2Total = 0;
  
  // If either scope 1 or scope 2 has verification, use their individual totals
  if (Boolean(scope1?.metadata?.verifiedBy) || Boolean(scope2?.metadata?.verifiedBy)) {
    scope1And2Total = (scope1?.total || 0) + (scope2?.calculatedTotalEmissions || 0);
  } 
  // Otherwise use the combined scope1And2 if it exists
  else {
    scope1And2Total = scope1And2?.total || 0;
  }
  
  // Add scope 3 emissions
  const scope3Total = scope3?.calculatedTotalEmissions || 0;
  
  return scope1And2Total + scope3Total;
}

function isNumber(n: unknown): n is number {
  return Number.isFinite(n)
}
