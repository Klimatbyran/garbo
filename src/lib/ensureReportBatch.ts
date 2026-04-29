import { prisma } from './prisma'

/**
 * Resolve pipeline `job.data.batchId` to a stable {@link Batch} row id for `ReportRun.batchDbId`.
 * Upserts by `batchName`; returns null when the string is missing or blank.
 */
export async function ensureReportBatch(
  batchName: string | null | undefined
): Promise<string | null> {
  const trimmed = typeof batchName === 'string' ? batchName.trim() : ''
  if (!trimmed) return null

  const batch = await prisma.batch.upsert({
    where: { batchName: trimmed },
    create: { batchName: trimmed },
    update: {},
  })
  return batch.id
}
