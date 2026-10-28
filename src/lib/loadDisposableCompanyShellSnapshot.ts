import { prisma } from './prisma'
import {
  explainDisposableCompanyShell,
  type DisposableCompanyShellSnapshot,
} from './disposableCompanyShell'

const companyShellSelect = {
  id: true,
  name: true,
  wikidataId: true,
  lei: true,
  url: true,
  logoUrl: true,
  description: true,
  internalComment: true,
  tags: true,
  alternativeNames: true,
  _count: {
    select: {
      reportingPeriods: true,
      goals: true,
      initiatives: true,
      descriptions: true,
    },
  },
  industry: { select: { id: true } },
  baseYear: { select: { id: true } },
  companyReports: { select: { registryReportId: true } },
  identifiers: { select: { type: true, value: true } },
} as const

function toSnapshot(
  company: {
    id: string
    name: string
    wikidataId: string | null
    lei: string | null
    url: string | null
    logoUrl: string | null
    description: string | null
    internalComment: string | null
    tags: string[]
    alternativeNames: string[]
    _count: {
      reportingPeriods: number
      goals: number
      initiatives: number
      descriptions: number
    }
    industry: { id: string } | null
    baseYear: { id: string } | null
    companyReports: { registryReportId: string | null }[]
    identifiers: { type: string; value: string }[]
  },
  activeReportRunCount: number
): DisposableCompanyShellSnapshot {
  return {
    id: company.id,
    name: company.name,
    wikidataId: company.wikidataId,
    lei: company.lei,
    url: company.url,
    logoUrl: company.logoUrl,
    description: company.description,
    internalComment: company.internalComment,
    tags: company.tags,
    alternativeNames: company.alternativeNames,
    reportingPeriodCount: company._count.reportingPeriods,
    goalCount: company._count.goals,
    initiativeCount: company._count.initiatives,
    descriptionCount: company._count.descriptions,
    hasIndustry: Boolean(company.industry),
    hasBaseYear: Boolean(company.baseYear),
    companyReports: company.companyReports,
    identifiers: company.identifiers,
    activeReportRunCount,
  }
}

/** Load a company snapshot for empty-shell evaluation. */
export async function loadDisposableCompanyShellSnapshot(
  companyId: string
): Promise<DisposableCompanyShellSnapshot | null> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: companyShellSelect,
  })
  if (!company) return null

  const activeReportRunCount = await prisma.reportRun.count({
    where: { companyId, status: 'running' },
  })

  return toSnapshot(company, activeReportRunCount)
}

/**
 * After checkDB re-resolves away from a precheck-created company, log when the
 * abandoned row is a disposable empty shell. Does not delete (log-only).
 * Best-effort: failures are logged and never fail the pipeline.
 */
export async function logAbandonedDisposableCompanyShell(input: {
  abandonedCompanyId: string
  keptCompanyId: string
  log: (message: string) => void
}): Promise<void> {
  try {
    const abandonedId = input.abandonedCompanyId.trim()
    const keptId = input.keptCompanyId.trim()
    if (!abandonedId || !keptId || abandonedId === keptId) return

    const snapshot = await loadDisposableCompanyShellSnapshot(abandonedId)
    if (!snapshot) {
      input.log(
        `Abandoned company ${abandonedId} not found after re-resolve to ${keptId}`
      )
      return
    }

    const verdict = explainDisposableCompanyShell(snapshot)
    if (verdict.disposable) {
      input.log(
        `Would delete empty company shell id=${snapshot.id} name="${snapshot.name}" (re-resolved to ${keptId})`
      )
      return
    }

    input.log(
      `Keeping abandoned company ${snapshot.id} after re-resolve to ${keptId} — not a disposable shell (${verdict.reasons.join(', ')})`
    )
  } catch (error) {
    input.log(
      `Failed empty-shell check for abandoned company ${input.abandonedCompanyId}: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

export { companyShellSelect, toSnapshot }
