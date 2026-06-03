import { Company } from '@prisma/client'

import { prisma } from '../../lib/prisma'
import { buildRegistryPayload } from '../../workers/saveToAPI.utils'
import { registryService } from './registryService'

export type ReportingPeriodReportIdentity = {
  year?: number | string
  reportURL?: string | null
  reportS3Url?: string | null
  reportSha256?: string | null
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
    const existing = await prisma.companyReport.findFirst({
      where: {
        companyId,
        registryReportId: registryReportId ?? null,
      },
      select: { id: true },
    })

    if (existing) return existing.id

    const created = await prisma.companyReport.create({
      data: {
        companyId,
        registryReportId: registryReportId ?? null,
      },
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

  async defaultCompanyReportIdForCompany(companyId: string): Promise<string> {
    const existing = await prisma.companyReport.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    })

    if (existing) return existing.id

    return this.findOrCreateCompanyReport(companyId, null)
  }

  async resolveCompanyReportIdForSave(
    company: Pick<Company, 'wikidataId' | 'name'>,
    reportingPeriods: ReportingPeriodReportIdentity[],
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
      const report = await registryService.upsertReportInRegistry(
        registryPayload
      )
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

    const companyReportId = await this.defaultCompanyReportIdForCompany(
      company.wikidataId
    )
    console.warn(
      '[companyReportService] Inferred companyReportId from company default shell',
      { companyId: company.wikidataId, companyReportId }
    )
    return { companyReportId, inferred: true }
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
