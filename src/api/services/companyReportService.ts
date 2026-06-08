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

    const registryPayload = buildRegistryPayload({
      data: {
        companyName: company.name,
        wikidata: { node: company.wikidataId },
        url: options?.reportIdentity?.url?.trim() ?? '',
        sourceUrl: options?.reportIdentity?.sourceUrl,
        pdfCache: options?.reportIdentity?.pdfCache,
        body: { reportingPeriods },
      },
    })

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
