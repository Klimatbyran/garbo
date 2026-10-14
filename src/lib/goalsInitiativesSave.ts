/**
 * Helpers for report-scoped goals/initiatives diff + save bodies.
 */

export function filterByReportId<T extends { reportId?: string | null }>(
  rows: T[] | null | undefined,
  reportId: string | undefined
): T[] {
  if (!rows?.length) return []
  if (!reportId?.trim()) return rows
  return rows.filter((row) => row.reportId === reportId)
}

/** Strip DB/diff noise so LLM compare focuses on content. */
export function stripGoalInitiativeDiffNoise<T extends Record<string, unknown>>(
  rows: T[] | null | undefined
): Array<Omit<T, 'id' | 'metadata' | 'reportId'>> {
  if (!rows?.length) return []
  return rows.map((row) => {
    const { id: _id, metadata: _m, reportId: _r, ...rest } = row
    return rest
  })
}

export function goalsInitiativesSaveExtras(jobData: {
  registryReportId?: string
  pdfCache?: { publicUrl?: string | null } | null
  reportS3Url?: string | null
}): {
  reportId?: string
  reportS3Url?: string
} {
  const reportId = jobData.registryReportId?.trim()
  const reportS3Url =
    jobData.reportS3Url?.trim() ||
    jobData.pdfCache?.publicUrl?.trim() ||
    undefined
  return {
    ...(reportId ? { reportId } : {}),
    ...(reportS3Url ? { reportS3Url } : {}),
  }
}
