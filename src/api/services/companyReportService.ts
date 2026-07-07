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
  registryReportId?: string
  documentReportYear?: string
  reportUrl?: string
  reportSourceUrl?: string
  reportS3Url?: string
  reportSha256?: string
}

export type EnsureCompanyReportRegistryLinkResult = {
  registryReportId: string
  companyReportId: string
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
  company: Pick<Company, 'id' | 'wikidataId' | 'name'>,
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
      ...(company.wikidataId
        ? { wikidata: { node: company.wikidataId } }
        : {}),
      url: mergedIdentity.url ?? '',
      sourceUrl: mergedIdentity.sourceUrl,
      pdfCache: mergedIdentity.pdfCache,
      documentReportYear,
      body: { reportingPeriods },
    },
  })
}

async function reassignPeriodsToCanonicalShell(
  companyId: string,
  fromShellId: string,
  toShellId: string,
  reportingPeriods: ReportingPeriodIdentity[]
): Promise<void> {
  const years = reportingPeriods
    .map((period) => {
      if (period.year === undefined || period.year === null) return null
      return String(period.year)
    })
    .filter((year): year is string => year !== null)

  if (years.length === 0) return

  for (const year of years) {
    const onWrongShell = await prisma.reportingPeriod.findFirst({
      where: { companyReportId: fromShellId, companyId, year },
      select: { id: true },
    })
    if (!onWrongShell) continue

    const onCanonical = await prisma.reportingPeriod.findFirst({
      where: { companyReportId: toShellId, companyId, year },
      select: { id: true },
    })

    if (onCanonical) {
      await prisma.reportingPeriod.delete({ where: { id: onWrongShell.id } })
    } else {
      await prisma.reportingPeriod.update({
        where: { id: onWrongShell.id },
        data: { companyReportId: toShellId },
      })
    }
  }

  const wrongShell = await prisma.companyReport.findUnique({
    where: { id: fromShellId },
    select: {
      registryReportId: true,
      _count: { select: { reportingPeriods: true } },
    },
  })

  if (
    wrongShell &&
    !wrongShell.registryReportId &&
    wrongShell._count.reportingPeriods === 0
  ) {
    await prisma.companyReport.delete({ where: { id: fromShellId } })
  }
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
    // TODO: After a pipeline run for a report year, keep CompanyReport and its linked Report
    // row fully in sync (reportYear, urls, sha256, publication date). setCompanyReportYear
    // only merges reportYear today; identity fields can drift across re-runs and manual edits.
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
    company: Pick<Company, 'id' | 'wikidataId' | 'name'>,
    reportingPeriods: ReportingPeriodIdentity[],
    options?: {
      companyReportId?: string
      registryReportId?: string
      reportIdentity?: SaveReportIdentity
    }
  ): Promise<{ companyReportId: string; inferred: boolean }> {
    const explicitId = options?.companyReportId?.trim()
    if (explicitId) {
      await this.assertCompanyReportBelongsToCompany(explicitId, company.id)
      return { companyReportId: explicitId, inferred: false }
    }

    const pipelineRegistryId = options?.registryReportId?.trim()
    if (pipelineRegistryId) {
      const companyReportId = await this.findOrCreateCompanyReport(
        company.id,
        pipelineRegistryId
      )
      return { companyReportId, inferred: true }
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
        company.id,
        report.id
      )
      console.warn(
        '[companyReportService] Inferred companyReportId from report identity',
        {
          companyId: company.id,
          companyReportId,
          registryReportId: report.id,
        }
      )
      return { companyReportId, inferred: true }
    }

    const companyReportId = await this.getOrCreateFallbackCompanyReportId(
      company.id
    )
    console.warn(
      '[companyReportService] Inferred companyReportId from latest CompanyReport for company',
      { companyId: company.id, companyReportId }
    )
    return { companyReportId, inferred: true }
  }

  async prepareCompanyReportForPeriodSave(
    company: Pick<Company, 'id' | 'wikidataId' | 'name'>,
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
        registryReportId: input.registryReportId,
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
    company: Pick<Company, 'id' | 'wikidataId' | 'name'>,
    reportingPeriods: ReportingPeriodIdentity[],
    input: PrepareCompanyReportForPeriodSaveInput
  ): Promise<EnsureCompanyReportRegistryLinkResult | null> {
    const existing = await prisma.companyReport.findUnique({
      where: { id: companyReportId },
      select: { registryReportId: true, companyId: true },
    })
    if (!existing) return null
    if (existing.registryReportId) {
      const documentReportYear = resolveDocumentReportYear(reportingPeriods, {
        documentReportYear: input.documentReportYear,
        reportUrl: input.reportUrl,
        sourceUrl: input.reportSourceUrl,
      })
      await this.setCompanyReportYear(companyReportId, documentReportYear)
      return {
        registryReportId: existing.registryReportId,
        companyReportId,
      }
    }

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
      await reassignPeriodsToCanonicalShell(
        existing.companyId,
        companyReportId,
        alreadyLinked.id,
        reportingPeriods
      )
      const documentReportYear = resolveDocumentReportYear(reportingPeriods, {
        documentReportYear: input.documentReportYear,
        reportUrl: input.reportUrl,
        sourceUrl: input.reportSourceUrl,
      })
      await this.setCompanyReportYear(alreadyLinked.id, documentReportYear)
      return {
        registryReportId: report.id,
        companyReportId: alreadyLinked.id,
      }
    }

    await prisma.companyReport.update({
      where: { id: companyReportId },
      data: { registryReportId: report.id },
    })

    const documentReportYear = resolveDocumentReportYear(reportingPeriods, {
      documentReportYear: input.documentReportYear,
      reportUrl: input.reportUrl,
      sourceUrl: input.reportSourceUrl,
    })
    await this.setCompanyReportYear(companyReportId, documentReportYear)

    return {
      registryReportId: report.id,
      companyReportId,
    }
  }

  async setCompanyReportRegistryLink(
    companyReportId: string,
    companyId: string,
    registryReportId: string
  ): Promise<void> {
    const company = await prisma.company.findFirstOrThrow({
      where: { id: companyId },
      select: { id: true, wikidataId: true },
    })

    await this.assertCompanyReportBelongsToCompany(companyReportId, company.id)

    const report = await prisma.report.findUnique({
      where: { id: registryReportId },
      select: { id: true, wikidataId: true },
    })
    if (!report) {
      throw new CompanyReportScopeError(
        `Registry report ${registryReportId} not found`
      )
    }

    if (
      report.wikidataId &&
      company.wikidataId &&
      report.wikidataId !== company.wikidataId
    ) {
      throw new CompanyReportScopeError(
        `Registry report ${registryReportId} belongs to ${report.wikidataId}, not ${company.wikidataId}`
      )
    }

    const conflicting = await prisma.companyReport.findFirst({
      where: {
        companyId: company.id,
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
