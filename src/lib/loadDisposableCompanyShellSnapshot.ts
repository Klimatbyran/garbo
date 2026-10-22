import { prisma } from './prisma'
import {
  explainDisposableCompanyShell,
  type DisposableCompanyShellSnapshot,
} from './disposableCompanyShell'

/** Load a company snapshot for empty-shell evaluation. */
export async function loadDisposableCompanyShellSnapshot(
  companyId: string
): Promise<DisposableCompanyShellSnapshot | null> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      wikidataId: true,
      lei: true,
      _count: { select: { reportingPeriods: true } },
      companyReports: { select: { registryReportId: true } },
      identifiers: { select: { type: true, value: true } },
    },
  })
  if (!company) return null

  const activeReportRunCount = await prisma.reportRun.count({
    where: { companyId, status: 'running' },
  })

  return {
    id: company.id,
    name: company.name,
    wikidataId: company.wikidataId,
    lei: company.lei,
    reportingPeriodCount: company._count.reportingPeriods,
    companyReports: company.companyReports,
    identifiers: company.identifiers,
    activeReportRunCount,
  }
}

/**
 * After checkDB re-resolves away from a precheck-created company, log when the
 * abandoned row is a disposable empty shell. Does not delete (log-only).
 */
export async function logAbandonedDisposableCompanyShell(input: {
  abandonedCompanyId: string
  keptCompanyId: string
  log: (message: string) => void
}): Promise<void> {
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
}
