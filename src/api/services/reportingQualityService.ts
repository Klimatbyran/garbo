import { prisma } from '../../lib/prisma'
import { companyReportService } from './companyReportService'

type MethodChange = {
  year: number | null
  description: string
}

type FragmentedValuesReporting =
  | 'NONE'
  | 'PARTS_WITH_TOTAL'
  | 'PARTS_ONLY_NO_TOTAL'
  | null

type Scope3CategoryFragmentation = {
  category: number
  fragmentedReporting: 'PARTS_WITH_TOTAL' | 'PARTS_ONLY_NO_TOTAL'
  example: string
}

type ReportingQualityInput = {
  url: string
  usesGhgProtocolCategories:
    | 'FULL'
    | 'GROUPED'
    | 'CUSTOM_LABELS'
    | 'SINGLE_TOTAL'
    | null
  categoryLabelsExample: string | null
  methodChanges: MethodChange[]
  missingScopesExplained: boolean | null
  missingScopesReason: string | null
  scope2MethodExplicit: boolean | null
  scope1FragmentedReporting: FragmentedValuesReporting
  scope1FragmentedExample: string | null
  scope2FragmentedReporting: FragmentedValuesReporting
  scope2FragmentedExample: string | null
  scope3CategoryFragmentation: Scope3CategoryFragmentation[]
}

class ReportingQualityService {
  async upsert(companyId: string, input: ReportingQualityInput): Promise<void> {
    const registryReport = await prisma.report.findFirst({
      where: { url: input.url },
      select: { id: true },
    })

    const companyReportId =
      await companyReportService.findOrCreateCompanyReport(
        companyId,
        registryReport?.id ?? null
      )

    const fields = {
      usesGhgProtocolCategories: input.usesGhgProtocolCategories,
      categoryLabelsExample: input.categoryLabelsExample,
      methodChanges: input.methodChanges,
      missingScopesExplained: input.missingScopesExplained,
      missingScopesReason: input.missingScopesReason,
      scope2MethodExplicit: input.scope2MethodExplicit,
      scope1FragmentedReporting: input.scope1FragmentedReporting,
      scope1FragmentedExample: input.scope1FragmentedExample,
      scope2FragmentedReporting: input.scope2FragmentedReporting,
      scope2FragmentedExample: input.scope2FragmentedExample,
      scope3CategoryFragmentation: input.scope3CategoryFragmentation,
    }

    await prisma.reportingQuality.upsert({
      where: { companyReportId },
      create: { companyReportId, ...fields },
      update: fields,
    })
  }
}

export const reportingQualityService = new ReportingQualityService()
