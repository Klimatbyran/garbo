import { prisma } from './prisma'

/**
 * Resolve `job.data.batchId` to a stable Garbo `Batch.id` for `ReportRun.batchDbId`.
 *
 * - If the value is an existing {@link Batch.id} (cuid), returns it.
 * - Otherwise treats the value as a **batch name** (legacy pipeline string) and upserts
 *   `Batch` by `batchName`, returning the row id.
 */
export async function resolveReportBatchDbId(
  batchIdFromJob: string | null | undefined
): Promise<string | null> {
  const trimmed =
    typeof batchIdFromJob === 'string' ? batchIdFromJob.trim() : ''
  if (!trimmed) return null

  const byId = await prisma.batch.findUnique({
    where: { id: trimmed },
    select: { id: true },
  })
  if (byId) return byId.id

  const batch = await prisma.batch.upsert({
    where: { batchName: trimmed },
    create: { batchName: trimmed },
    update: {},
  })
  return batch.id
}
