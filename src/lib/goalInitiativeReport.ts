import { Prisma } from '@prisma/client'

/**
 * Shared Goal/Initiative helpers for optional registry Report linkage and
 * pipeline replace-unverified-for-report.
 */

export type CreateWithReportOptions = {
  /**
   * When true with a reportId, delete unverified rows for that report before
   * inserting. Pipeline bulk save sets this; editor single-creates must not.
   */
  replaceUnverifiedForReport?: boolean
}

export type ReportScopedEntity = 'goal' | 'initiative'

/** Normalize batch-level reportId from a POST body. */
export function resolveBatchReportId(reportId?: string | null): string | null {
  return reportId?.trim() || null
}

/** Per-item reportId falls back to the batch reportId. */
export function resolveItemReportId(
  itemReportId: unknown,
  batchReportId: string | null
): string | null {
  return (
    (typeof itemReportId === 'string' && itemReportId.trim()) || batchReportId
  )
}

export function shouldReplaceUnverifiedForReport(
  options: CreateWithReportOptions,
  batchReportId: string | null
): boolean {
  return Boolean(options.replaceUnverifiedForReport) && Boolean(batchReportId)
}

/** Prisma connect for create when a reportId is present. */
export function reportConnectCreate(reportId: string | null | undefined) {
  return reportId ? { report: { connect: { id: reportId } } } : {}
}

/**
 * Prisma relation update for optional reportId:
 * - undefined → leave unchanged
 * - null/'' → disconnect
 * - string → connect
 */
export function reportRelationUpdate(reportId: string | null | undefined): {
  report?: { connect: { id: string } } | { disconnect: true }
} {
  if (reportId === undefined) return {}
  if (reportId === null || reportId === '') {
    return { report: { disconnect: true } }
  }
  return { report: { connect: { id: reportId } } }
}

/**
 * Delete unverified Goal/Initiative rows for a company+report inside a
 * transaction (metadata first, then the entity).
 */
export async function deleteUnverifiedForReport(
  tx: Prisma.TransactionClient,
  opts: {
    companyId: string
    reportId: string
    entity: ReportScopedEntity
  }
): Promise<void> {
  const { companyId, reportId, entity } = opts
  const select = {
    id: true,
    metadata: {
      orderBy: { updatedAt: 'desc' as const },
      take: 1,
      select: { verifiedByUserId: true },
    },
  }

  const existing =
    entity === 'goal'
      ? await tx.goal.findMany({
          where: { companyId, reportId },
          select,
        })
      : await tx.initiative.findMany({
          where: { companyId, reportId },
          select,
        })

  const ids = existing
    .filter((row) => !row.metadata[0]?.verifiedByUserId)
    .map((row) => row.id)

  if (!ids.length) return

  if (entity === 'goal') {
    await tx.metadata.deleteMany({ where: { goalId: { in: ids } } })
    await tx.goal.deleteMany({ where: { id: { in: ids } } })
  } else {
    await tx.metadata.deleteMany({ where: { initiativeId: { in: ids } } })
    await tx.initiative.deleteMany({ where: { id: { in: ids } } })
  }
}
