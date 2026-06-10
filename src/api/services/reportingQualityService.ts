import { prisma } from '../../lib/prisma'
import { companyReportService } from './companyReportService'

type MethodChange = {
  year: number | null
  description: string
}

type ReportingQualityInput = {
  url: string
  usesGhgProtocolCategories: boolean | null
  methodChanges: MethodChange[]
  missingScopesExplained: boolean | null
}

class ReportingQualityService {
  async upsert(
    wikidataId: string,
    input: ReportingQualityInput
  ): Promise<void> {
    const registryReport = await prisma.report.findFirst({
      where: { url: input.url },
      select: { id: true },
    })

    const companyReportId =
      await companyReportService.findOrCreateCompanyReport(
        wikidataId,
        registryReport?.id ?? null
      )

    await prisma.reportingQuality.upsert({
      where: { companyReportId },
      create: {
        companyReportId,
        usesGhgProtocolCategories: input.usesGhgProtocolCategories,
        methodChanges: input.methodChanges,
        missingScopesExplained: input.missingScopesExplained,
      },
      update: {
        usesGhgProtocolCategories: input.usesGhgProtocolCategories,
        methodChanges: input.methodChanges,
        missingScopesExplained: input.missingScopesExplained,
      },
    })
  }
}

export const reportingQualityService = new ReportingQualityService()
