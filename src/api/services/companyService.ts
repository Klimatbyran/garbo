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

    const rawTransformed = companies.map((data) =>
      transformMetadata(data, !authenticated),
    )

    if (process.env.DEBUG_DATE_SHAPES === '1') {
      for (const c of rawTransformed) {
        if (!c || !Array.isArray(c.reportingPeriods)) continue
        for (const rp of c.reportingPeriods) {
          if (!rp) continue
          const startType = rp.startDate === null ? 'null' : typeof rp.startDate
          const endType = rp.endDate === null ? 'null' : typeof rp.endDate
          if (
            (startType === 'object' && !(rp.startDate instanceof Date)) ||
            (endType === 'object' && !(rp.endDate instanceof Date))
          ) {
            console.warn(
              'DEBUG_DATE_SHAPES: found bad reportingPeriod shape for company',
              c.wikidataId,
            )
            console.warn('reportingPeriod:', JSON.stringify(rp, null, 2))
            break
          }
        }
      }
    }

    const transformedCompanies = addCalculatedTotalEmissions(
      rawTransformed.map((data) => coerceReportingPeriodDates(data)),
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

    const rawTransformed = companies.map((data) =>
      transformMetadata(data, !authenticated),
    )

    if (process.env.DEBUG_DATE_SHAPES === '1') {
      for (const c of rawTransformed) {
        if (!c || !Array.isArray(c.reportingPeriods)) continue
        for (const rp of c.reportingPeriods) {
          if (!rp) continue
          const startType = rp.startDate === null ? 'null' : typeof rp.startDate
          const endType = rp.endDate === null ? 'null' : typeof rp.endDate
          if (
            (startType === 'object' && !(rp.startDate instanceof Date)) ||
            (endType === 'object' && !(rp.endDate instanceof Date))
          ) {
            console.warn(
              'DEBUG_DATE_SHAPES: found bad reportingPeriod shape for company',
              c.wikidataId,
            )
            console.warn('reportingPeriod:', JSON.stringify(rp, null, 2))
            break
          }
        }
      }
    }

    const transformedCompanies = addCalculatedTotalEmissions(
      rawTransformed.map((data) => coerceReportingPeriodDates(data)),
    )

    return transformedCompanies
  }
  async getCompanyWithMetadata(
    wikidataId: string,
    authenticated: boolean = false,
  ) {
    const company = await prisma.company.findFirstOrThrow({
      ...detailedCompanyArgs,
      where: { wikidataId },
    })

    const rawTransformed = transformMetadata(company, !authenticated)

    if (process.env.DEBUG_DATE_SHAPES === '1') {
      if (rawTransformed && Array.isArray(rawTransformed.reportingPeriods)) {
        for (const rp of rawTransformed.reportingPeriods) {
          if (!rp) continue
          const startType = rp.startDate === null ? 'null' : typeof rp.startDate
          const endType = rp.endDate === null ? 'null' : typeof rp.endDate
          if (
            (startType === 'object' && !(rp.startDate instanceof Date)) ||
            (endType === 'object' && !(rp.endDate instanceof Date))
          ) {
            console.warn(
              'DEBUG_DATE_SHAPES: found bad reportingPeriod shape for company',
              rawTransformed.wikidataId,
            )
            console.warn('reportingPeriod:', JSON.stringify(rp, null, 2))
            break
          }
        }
      }
    }

    const [transformedCompany] = addCalculatedTotalEmissions([
      coerceReportingPeriodDates(rawTransformed),
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
          const meta = value[0] || null
          if (onlyIncludeVerified) {
            acc[key] = meta
              ? { verified: meta.verifiedBy !== null }
              : { verified: false }
          } else {
            acc[key] = meta
              ? { ...meta, verified: meta.verifiedBy !== null }
              : null
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

export function coerceReportingPeriodDates(company: any) {
  if (!company || !Array.isArray(company.reportingPeriods)) return company

  company.reportingPeriods = company.reportingPeriods.map((rp: any) => {
    const coerce = (val: any) => {
      if (val == null) return val
      if (val instanceof Date) return val.toISOString()
      if (typeof val === 'string') {
        const parsed = new Date(val)
        return isNaN(parsed.getTime()) ? val : parsed.toISOString()
      }

      if (typeof val === 'object') {
        // if it's a Date-like object with toISOString
        if (typeof (val as any).toISOString === 'function') {
          try {
            return (val as any).toISOString()
          } catch (e) {
            // continue to other heuristics
          }
        }

        // handle MongoDB / ISO wrappers like { $date: '...' } or { date: '...' }
        const maybeStr = (val.$date ??
          val.date ??
          val.iso ??
          val.ISO ??
          val.value) as string | undefined
        if (typeof maybeStr === 'string') {
          const parsed = new Date(maybeStr)
          if (!isNaN(parsed.getTime())) return parsed.toISOString()
        }

        // Firestore-like timestamp: { seconds, nanoseconds } or { _seconds, _nanoseconds }
        const seconds = (val.seconds ?? val._seconds) as number | undefined
        const nanos = (val.nanoseconds ?? val._nanoseconds) as
          | number
          | undefined
        if (typeof seconds === 'number') {
          const ms = Math.round((seconds as number) * 1000 + (nanos ?? 0) / 1e6)
          const asDate = new Date(ms)
          if (!isNaN(asDate.getTime())) return asDate.toISOString()
        }

        // handle { year, month, day }
        if ((val.year || val.month || val.day) && !Array.isArray(val)) {
          const year = Number(val.year)
          const month = Number(val.month) - 1
          const day = Number(val.day)
          if (
            !Number.isNaN(year) &&
            !Number.isNaN(month) &&
            !Number.isNaN(day)
          ) {
            return new Date(Date.UTC(year, month, day)).toISOString()
          }
        }

        // try generic Date coercion as a last resort
        try {
          const asDate = new Date(val as any)
          if (!isNaN(asDate.getTime())) return asDate.toISOString()
        } catch (e) {
          // fallthrough
        }
      }

      return val
    }

    return {
      ...rp,
      startDate: coerce(rp.startDate),
      endDate: coerce(rp.endDate),
    }
  })

  return company
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
              calculatedTotalEmissions:
                (scope1?.total ?? 0) +
                (scope2Total ?? 0) +
                (scope3Total !== 0
                  ? scope3Total
                  : (scope3.statedTotalEmissions.total ?? 0)),
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
