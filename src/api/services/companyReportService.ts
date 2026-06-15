import { Company } from '@prisma/client'

import { prisma } from '../../lib/prisma'
import {
  buildRegistryPayload,
  resolveDocumentReportYear,
} from '../../workers/saveToAPI.utils'
import { mergeReportYearFromPipeline } from './registryReportIdentity'
import { registryService } from './registryService'

export type ReportingPeriodIdentity = {
  year?: number | string
  companyReportId?: string
  reportURL?: string | null
  reportS3Url?: string | null
  reportSha256?: string | null
}

export type PrepareCompanyReportForPeriodSaveInput = {
  bodyCompanyReportId?: string
  documentReportYear?: string
  reportUrl?: string
  reportSourceUrl?: string
  reportS3Url?: string
  reportSha256?: string
}

export type SaveReportIdentity = {
  url?: string
  sourceUrl?: string
  pdfCache?: { publicUrl?: string; sha256?: string }
}

function trimOptional(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function mergeReportIdentityFromPeriods(
  reportingPeriods: ReportingPeriodIdentity[],
  identity?: SaveReportIdentity
): SaveReportIdentity {
  const periodWithUrl = reportingPeriods.find((period) =>
    trimOptional(period.reportURL)
  )
  const periodWithS3 = reportingPeriods.find((period) =>
    trimOptional(period.reportS3Url)
  )
  const periodWithSha = reportingPeriods.find((period) =>
    trimOptional(period.reportSha256)
  )

  const publicUrl =
    trimOptional(identity?.pdfCache?.publicUrl) ??
    trimOptional(periodWithS3?.reportS3Url)
  const sha256 =
    trimOptional(identity?.pdfCache?.sha256) ??
    trimOptional(periodWithSha?.reportSha256)

  return {
    url:
      trimOptional(identity?.url) ??
      trimOptional(periodWithUrl?.reportURL) ??
      trimOptional(periodWithS3?.reportS3Url) ??
      '',
    sourceUrl: trimOptional(identity?.sourceUrl),
    pdfCache: publicUrl || sha256 ? { publicUrl, sha256 } : identity?.pdfCache,
  }
}

function buildRegistryPayloadForCompanySave(
  company: Pick<Company, 'wikidataId' | 'name'>,
  reportingPeriods: ReportingPeriodIdentity[],
  identity?: SaveReportIdentity,
  documentReportYear?: string
) {
  const mergedIdentity = mergeReportIdentityFromPeriods(
    reportingPeriods,
    identity
  )

  return buildRegistryPayload({
    data: {
      companyName: company.name,
      wikidata: { node: company.wikidataId },
      url: mergedIdentity.url ?? '',
      sourceUrl: mergedIdentity.sourceUrl,
      pdfCache: mergedIdentity.pdfCache,
      documentReportYear,
      body: { reportingPeriods },
    },
  })
}

class CompanyReportService {
  async findOrCreateCompanyReport(
    companyId: string,
    registryReportId: string | null
  ): Promise<string> {
    if (registryReportId !== null) {
      const row = await prisma.companyReport.upsert({
        where: {
          companyId_registryReportId: {
            companyId,
            registryReportId,
          },
        },
        create: {
          companyId,
          registryReportId,
        },
        update: {},
        select: { id: true },
      })

      return row.id
    }

    const existing = await prisma.companyReport.findFirst({
      where: { companyId, registryReportId: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    })

    if (existing) return existing.id

    const created = await prisma.companyReport.create({
      data: { companyId, registryReportId: null },
      select: { id: true },
    })

    return created.id
  }

  async assertCompanyReportBelongsToCompany(
    companyReportId: string,
    companyId: string
  ): Promise<void> {
    const row = await prisma.companyReport.findFirst({
      where: { id: companyReportId, companyId },
      select: { id: true },
    })

    if (!row) {
      throw new CompanyReportScopeError(
        `companyReportId ${companyReportId} does not belong to company ${companyId}`
      )
    }
  }

  async setCompanyReportYear(
    companyReportId: string,
    documentReportYear: string | undefined
  ): Promise<void> {
    const incoming = documentReportYear?.trim()
    if (!incoming || !/^\d{4}$/.test(incoming)) return

    const existing = await prisma.companyReport.findUnique({
      where: { id: companyReportId },
      select: { reportYear: true, registryReportId: true },
    })
    if (!existing) return

    const mergedYear = mergeReportYearFromPipeline(
      existing.reportYear,
      incoming
    )
    if (!mergedYear) return

    await prisma.companyReport.update({
      where: { id: companyReportId },
      data: { reportYear: mergedYear },
    })

    if (existing.registryReportId) {
      const registryRow = await prisma.report.findUnique({
        where: { id: existing.registryReportId },
        select: { reportYear: true },
      })
      const registryYear = mergeReportYearFromPipeline(
        registryRow?.reportYear,
        mergedYear
      )
      if (registryYear) {
        await prisma.report.update({
          where: { id: existing.registryReportId },
          data: { reportYear: registryYear },
        })
      }
    }
  }

  async getOrCreateFallbackCompanyReportId(companyId: string): Promise<string> {
    const existing = await prisma.companyReport.findFirst({
      where: { companyId },
      orderBy: [{ reportYear: 'desc' }, { createdAt: 'desc' }],
      select: { id: true },
    })

    if (existing) return existing.id

    return this.findOrCreateCompanyReport(companyId, null)
  }

  async resolveCompanyReportIdForSave(
    company: Pick<Company, 'wikidataId' | 'name'>,
    reportingPeriods: ReportingPeriodIdentity[],
    options?: {
      companyReportId?: string
      reportIdentity?: SaveReportIdentity
    }
  ): Promise<{ companyReportId: string; inferred: boolean }> {
    const explicitId = options?.companyReportId?.trim()
    if (explicitId) {
      await this.assertCompanyReportBelongsToCompany(
        explicitId,
        company.wikidataId
      )
      return { companyReportId: explicitId, inferred: false }
    }

    const registryPayload = buildRegistryPayloadForCompanySave(
      company,
      reportingPeriods,
      options?.reportIdentity
    )

    if (registryPayload) {
      const report =
        await registryService.upsertReportInRegistry(registryPayload)
      const companyReportId = await this.findOrCreateCompanyReport(
        company.wikidataId,
        report.id
      )
      console.warn(
        '[companyReportService] Inferred companyReportId from report identity',
        {
          companyId: company.wikidataId,
          companyReportId,
          registryReportId: report.id,
        }
      )
      return { companyReportId, inferred: true }
    }

    const companyReportId = await this.getOrCreateFallbackCompanyReportId(
      company.wikidataId
    )
    console.warn(
      '[companyReportService] Inferred companyReportId from latest CompanyReport for company',
      { companyId: company.wikidataId, companyReportId }
    )
    return { companyReportId, inferred: true }
  }

  async prepareCompanyReportForPeriodSave(
    company: Pick<Company, 'wikidataId' | 'name'>,
    reportingPeriods: ReportingPeriodIdentity[],
    input: PrepareCompanyReportForPeriodSaveInput
  ): Promise<{
    companyReportId: string
    documentReportYear: string | undefined
  }> {
    const { companyReportId } = await this.resolveCompanyReportIdForSave(
      company,
      reportingPeriods,
      {
        companyReportId: input.bodyCompanyReportId,
        reportIdentity: {
          url: input.reportUrl,
          sourceUrl: input.reportSourceUrl,
          pdfCache:
            input.reportS3Url || input.reportSha256
              ? {
                  publicUrl: input.reportS3Url,
                  sha256: input.reportSha256,
                }
              : undefined,
        },
      }
    )

    const documentReportYear = resolveDocumentReportYear(reportingPeriods, {
      documentReportYear: input.documentReportYear,
      reportUrl: input.reportUrl,
      sourceUrl: input.reportSourceUrl,
    })

    await this.setCompanyReportYear(companyReportId, documentReportYear)

    return { companyReportId, documentReportYear }
  }

  /**
   * Link CompanyReport.registryReportId when prepare used a fallback shell but
   * report identity is available (common when top-level reportUrl was missing).
   */
  async ensureCompanyReportRegistryLink(
    companyReportId: string,
    company: Pick<Company, 'wikidataId' | 'name'>,
    reportingPeriods: ReportingPeriodIdentity[],
    input: PrepareCompanyReportForPeriodSaveInput
  ): Promise<string | null> {
    const existing = await prisma.companyReport.findUnique({
      where: { id: companyReportId },
      select: { registryReportId: true, companyId: true },
    })
    if (!existing) return null
    if (existing.registryReportId) return existing.registryReportId

    const registryPayload = buildRegistryPayloadForCompanySave(
      company,
      reportingPeriods,
      {
        url: input.reportUrl,
        sourceUrl: input.reportSourceUrl,
        pdfCache:
          input.reportS3Url || input.reportSha256
            ? {
                publicUrl: input.reportS3Url,
                sha256: input.reportSha256,
              }
            : undefined,
      },
      input.documentReportYear
    )
    if (!registryPayload) return null

    const report = await registryService.upsertReportInRegistry(registryPayload)

    const alreadyLinked = await prisma.companyReport.findFirst({
      where: {
        companyId: existing.companyId,
        registryReportId: report.id,
      },
      select: { id: true },
    })
    if (alreadyLinked && alreadyLinked.id !== companyReportId) {
      console.warn(
        '[companyReportService] Registry report already linked to another CompanyReport',
        {
          companyId: existing.companyId,
          companyReportId,
          linkedShellId: alreadyLinked.id,
          registryReportId: report.id,
        }
      )
      return report.id
    }

    await prisma.companyReport.update({
      where: { id: companyReportId },
      data: { registryReportId: report.id },
    })

    return report.id
  }

  async setCompanyReportRegistryLink(
    companyReportId: string,
    companyWikidataId: string,
    registryReportId: string
  ): Promise<void> {
    await this.assertCompanyReportBelongsToCompany(
      companyReportId,
      companyWikidataId
    )

    const report = await prisma.report.findUnique({
      where: { id: registryReportId },
      select: { id: true, wikidataId: true },
    })
    if (!report) {
      throw new CompanyReportScopeError(
        `Registry report ${registryReportId} not found`
      )
    }

    if (report.wikidataId && report.wikidataId !== companyWikidataId) {
      throw new CompanyReportScopeError(
        `Registry report ${registryReportId} belongs to ${report.wikidataId}, not ${companyWikidataId}`
      )
    }

    const conflicting = await prisma.companyReport.findFirst({
      where: {
        companyId: companyWikidataId,
        registryReportId,
        NOT: { id: companyReportId },
      },
      select: { id: true },
    })
    if (conflicting) {
      throw new CompanyReportScopeError(
        `Registry report already linked to CompanyReport ${conflicting.id}`
      )
    }

    await prisma.companyReport.update({
      where: { id: companyReportId },
      data: { registryReportId },
    })
  }

  async companyReportIdForPeriodSave(
    companyId: string,
    defaultCompanyReportId: string,
    periodCompanyReportId: string | undefined,
    documentReportYear: string | undefined
  ): Promise<string> {
    if (!periodCompanyReportId) {
      return defaultCompanyReportId
    }

    await this.assertCompanyReportBelongsToCompany(
      periodCompanyReportId,
      companyId
    )

    if (periodCompanyReportId !== defaultCompanyReportId) {
      await this.setCompanyReportYear(periodCompanyReportId, documentReportYear)
    }

    return periodCompanyReportId
  }
}

export class CompanyReportScopeError extends Error {
  readonly statusCode = 400

  constructor(message: string) {
    super(message)
    this.name = 'CompanyReportScopeError'
  }
}

export const companyReportService = new CompanyReportService()
