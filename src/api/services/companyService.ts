import {
  Employees,
  Metadata,
  Turnover,
  Description,
  Prisma,
  User,
} from '@prisma/client'
import { OptionalNullable } from '../../lib/type-utils'
import { DefaultEconomyType } from '../types'
import { prisma } from '../../lib/prisma'
import {
  economyArgs,
  detailedCompanyArgs,
  pipelineCompanyDetailArgs,
  companyListArgs,
} from '../args'
import {
  calculateEmissionChangeLastTwoYears,
  calculateScope2Total,
  calculateScope3Total,
  calculatedTotalEmissions,
} from '@/lib/company-emissions/companyEmissionsCalculator'
import { calculateFutureEmissionTrend } from '@/lib/company-emissions/companyEmissionsFutureTrendCalculator'
import { calculateCompanyKpi } from '@/lib/company-emissions/companyKpiCalculator'
import Firecrawl, { SearchResultWeb } from '@mendable/firecrawl-js'
import { CompanyReports, SaveReportsBody, SaveReportsResult } from '../types'
import { pdf } from 'pdf-to-img'
import ky from 'ky'
import sharp from 'sharp'
import { ReportsListResponseSchema } from '../schemas/response'
import { z } from 'zod'
import { registryService } from './registryService'
import { pickOnePeriodPerDataYear } from './reportingPeriodPublicRead'
import { companyIdentifierService } from './companyIdentifierService'
import type { ReportingPeriod } from '@/types'

const API_KEY = process.env.FIRECRAWL_API_KEY

// TODO: Evaluate mapping the firecrawler type to internal type definition.
type ReportsListResponse = z.infer<typeof ReportsListResponseSchema>

class CompanyService {
  private enrichCompaniesWithMetadata(
    companies: Array<{ reportingPeriods: unknown[] } & Record<string, unknown>>,
    onePeriodPerDataYear: boolean
  ) {
    const withPeriods = onePeriodPerDataYear
      ? companies.map((company) => ({
          ...company,
          reportingPeriods: pickOnePeriodPerDataYear(
            company.reportingPeriods as Parameters<
              typeof pickOnePeriodPerDataYear
            >[0]
          ),
        }))
      : companies

    const transformedCompanies = withPeriods.map(transformMetadata)

    const companiesWithCalculatedTotalEmissions =
      addCalculatedTotalEmissions(transformedCompanies)

    const companiesWithEmissionsChange = addCompanyEmissionChange(
      companiesWithCalculatedTotalEmissions
    )

    return addFutureEmissionsTrendSlope(companiesWithEmissionsChange)
  }

  /** All reporting period rows (internal / editor). */
  async getAllCompaniesWithMetadata() {
    const companies = await prisma.company.findMany(companyListArgs)
    return this.enrichCompaniesWithMetadata(companies, false)
  }

  /** Public API: one period per data year (highest CompanyReport.reportYear wins). */
  async getAllCompaniesForPublicRead() {
    const companies = await prisma.company.findMany(companyListArgs)
    return this.enrichCompaniesWithMetadata(companies, true)
  }

  async getCompanyKpis() {
    const companies = await this.getAllCompaniesForPublicRead()
    return companies.map((company) => calculateCompanyKpi(company))
  }

  async getAllCompaniesBySearchTerm(
    searchTerm: string,
    options?: { onePeriodPerDataYear?: boolean }
  ) {
    const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase('sv-SE')
    const likePattern = normalizedSearchTerm + '%'

    const matches = await prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`
      SELECT "id"
      FROM "Company"
      WHERE lower(name) LIKE ${likePattern}
         OR (
              char_length(${normalizedSearchTerm}) >= 3
              AND to_tsvector('simple', name) @@ websearch_to_tsquery('simple', ${normalizedSearchTerm})
            )
      ORDER BY
        CASE WHEN lower(name) LIKE ${likePattern} THEN 0 ELSE 1 END,
        ts_rank(to_tsvector('simple', name), websearch_to_tsquery('simple', ${normalizedSearchTerm})) DESC,
        name ASC
      LIMIT 30
    `
    )

    const orderedIds = matches.map((m) => m.id)

    const companies = await prisma.company.findMany({
      ...companyListArgs,
      where: { id: { in: orderedIds } },
    })

    const sorted = orderedIds
      .map((id) => companies.find((c) => c.id === id))
      .filter(
        (company): company is NonNullable<typeof company> =>
          company !== undefined
      )

    return this.enrichCompaniesWithMetadata(
      sorted,
      options?.onePeriodPerDataYear ?? false
    )
  }

  async getCompanyWithMetadata(wikidataId: string) {
    const company = await prisma.company.findFirstOrThrow({
      ...pipelineCompanyDetailArgs,
      where: {
        wikidataId,
      },
    })
    const [transformedCompany] = this.enrichCompaniesWithMetadata(
      [company],
      false
    )
    return transformedCompany
  }

  async getCompanyForPublicRead(wikidataId: string) {
    const company = await prisma.company.findFirstOrThrow({
      ...detailedCompanyArgs,
      where: {
        wikidataId,
      },
    })
    const [transformedCompany] = this.enrichCompaniesWithMetadata(
      [company],
      true
    )
    return transformedCompany
  }

  async getCompanyByInternalId(id: string) {
    return prisma.company.findFirstOrThrow({
      where: { id },
      include: { baseYear: true },
    })
  }

  async getCompany(wikidataId: string) {
    return prisma.company.findFirstOrThrow({
      where: { wikidataId },
      include: { baseYear: true },
    })
  }

  async upsertCompany({
    wikidataId,
    user,
    ...data
  }: {
    wikidataId: string
    name: string
    url?: string
    logoUrl?: string
    internalComment?: string
    tags?: string[]
    lei?: string
    user?: User
  }) {
    const company = await prisma.company.upsert({
      where: {
        wikidataId,
      },
      create: {
        ...data,
        wikidataId,
      },
      update: { ...data },
    })

    await companyIdentifierService.syncFromLegacyColumns(company, {
      user,
      source: user ? 'validate-editor' : 'company-column-sync',
    })

    return company
  }

  async updateCompanyWikidataIdentifier(
    companyId: string,
    newWikidataId: string,
    user?: User
  ): Promise<void> {
    if (!newWikidataId.trim()) return

    const existing = await prisma.company.findFirstOrThrow({
      where: { id: companyId },
    })
    if (existing.wikidataId === newWikidataId) return

    const conflict = await prisma.company.findFirst({
      where: { wikidataId: newWikidataId, NOT: { id: companyId } },
    })
    if (conflict) {
      throw Object.assign(
        new Error(`Wikidata ID ${newWikidataId} is already in use`),
        { code: 409 }
      )
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: { wikidataId: newWikidataId },
    })

    await companyIdentifierService.syncFromLegacyColumns(updated, {
      user,
      source: user ? 'validate-editor' : 'wikidata-update',
    })
  }

  async updateCompanyTags(companyId: string, tags: string[]) {
    return prisma.company.update({
      where: { id: companyId },
      data: { tags },
    })
  }

  async deleteCompany(companyId: string) {
    return prisma.company.delete({ where: { id: companyId } })
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
      where: {
        companyId_language: {
          companyId,
          language: description.language,
        },
      },
      create: {
        text: description.text,
        language: description.language,
        company: {
          connect: { id: companyId },
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

  async collectReportUrls(
    companies: CompanyReports
  ): Promise<ReportsListResponse> {
    const firecrawl = new Firecrawl({ apiKey: API_KEY })
    const results: ReportsListResponse = []

    for (const company of companies) {
      const year = company.reportYear ? `${company.reportYear}` : ''
      const searchQuery = `"${company.name}" ${year} (sustainability report OR annual report) filetype:pdf Sweden`

      const searchResult = await firecrawl.search(searchQuery, { limit: 5 })

      let companyResults: Array<{
        url?: string
        title?: string
        description?: string
        position?: number
      }> = []
      if (searchResult.web && searchResult.web.length > 0) {
        companyResults = await Promise.all(
          searchResult.web
            .filter((result): result is SearchResultWeb => 'url' in result)
            .map(async (result, idx) => {
              try {
                const endUrl = await ky(result.url)
                if (endUrl.url.endsWith('.pdf')) {
                  return {
                    url: endUrl.url,
                    title: result.title,
                    description: result.description,
                    position: idx,
                  }
                }
              } catch {
                // Fallback to original URL if ky fails
                return {
                  url: result.url,
                  title: result.title,
                  description: result.description,
                  position: idx,
                  error: 'Failed to resolve PDF link',
                }
              }
              return {
                url: result.url,
                title: result.title,
                description: result.description,
                position: idx,
              }
            })
        )
      }

      results.push({
        companyName: company.name,
        results: companyResults,
      })
    }

    return results
  }

  /**
   * Generates a preview image (JPG) from the first page of a PDF URL.
   * Returns a data URL or null if failed.
   */
  async generateReportPreview(pdfUrl: string): Promise<Buffer | null> {
    console.log(pdfUrl)
    try {
      const response = await ky(pdfUrl)
      const arrayBuffer = await response.arrayBuffer()
      const pdfBuffer = Buffer.from(arrayBuffer)
      const document = await pdf(pdfBuffer, { scale: 0.5 })
      const pageBuffer = await document.getPage(1)

      const jpegBuffer = await sharp(pageBuffer)
        .jpeg({ quality: 60 })
        .toBuffer()
      return jpegBuffer
    } catch {
      return null
    }
  }

  async getAllCompanies() {
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        wikidataId: true,
        tags: true,
        reportingPeriods: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            reportURL: true,
            reportS3Url: true,
            reportSha256: true,
          },
        },
      },
    })
    return companies
  }

  async saveReportsToDb(
    saveReportsBody: SaveReportsBody
  ): Promise<SaveReportsResult> {
    const results: SaveReportsResult = []

    for (const report of saveReportsBody) {
      try {
        const saved = await registryService.upsertReportInRegistry({
          companyName: report.companyName,
          wikidataId: report.wikidataId ?? undefined,
          reportYear: report.reportYear,
          url: report.url,
          sourceUrl: report.sourceUrl,
          s3Url: report.s3Url,
          s3Key: report.s3Key,
          s3Bucket: report.s3Bucket,
          sha256: report.sha256,
        })

        results.push({
          id: saved.id,
          companyName: saved.companyName,
          wikidataId: saved.wikidataId,
          reportYear: saved.reportYear,
          url: saved.url,
        })
      } catch (error: any) {
        if (error?.code === 'P2002') {
          results.push({
            error: 'duplicate',
            companyName: report.companyName,
            reportYear: report.reportYear,
            message: 'A report with this URL already exists.',
          })
          continue
        }

        results.push({
          error: 'unknown',
          companyName: report.companyName,
          reportYear: report.reportYear,
          message: 'Failed to save report.',
        })
      }
    }

    return results
  }
}

export const companyService = new CompanyService()

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
      {} as Record<string, any>
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
          const { scope2, scope3 } = reportingPeriod.emissions || {}

          const scope2Total = calculateScope2Total(scope2)
          const scope3Total = calculateScope3Total(scope3)
          const totalEmissions = calculatedTotalEmissions(
            reportingPeriod.emissions
          )

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
              calculatedTotalEmissions: totalEmissions,
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
        sortReportingPeriodsByEndDate(company.reportingPeriods)
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
        reportedPeriods: company.reportingPeriods.map(
          (period: ReportingPeriod) => ({
            year: new Date(period.endDate).getFullYear(),
            emissions: period.emissions,
          })
        ),
        baseYear: company.baseYear,
      }

      const baseYear = transformedCompany.baseYear?.year

      const slope = calculateFutureEmissionTrend(
        transformedCompany.reportedPeriods,
        baseYear
      )

      // Ensure we always return a valid value (number or null)
      const validSlope =
        typeof slope === 'number' && Number.isFinite(slope) ? slope : null

      return {
        ...company,
        futureEmissionsTrendSlope: validSlope,
      }
    } catch (error) {
      console.error(
        'Error calculating future emissions trend slope for company:',
        company.wikidataId,
        error
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
    (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  )
}

function addEmissionTrendsToReportingPeriods(periods: any[]) {
  periods.forEach((period: any, index: number) => {
    if (index < periods.length - 1) {
      const previousPeriod = periods[index + 1]
      period.emissionsChangeLastTwoYears = calculateEmissionChangeLastTwoYears(
        period,
        previousPeriod
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
