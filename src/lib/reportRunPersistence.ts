import { prisma } from './prisma'

export function companyReportIdFromJobData(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const id = (data as { companyReportId?: unknown }).companyReportId
  return typeof id === 'string' && id.trim() ? id.trim() : null
}

export function companyIdFromJobData(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const id = (data as { companyId?: unknown }).companyId
  return typeof id === 'string' && id.trim() ? id.trim() : null
}

/** Prefer explicit auto-run registry id from job data when present. */
export function registryReportIdFromJobData(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const id = (data as { autoRunReportId?: unknown }).autoRunReportId
  return typeof id === 'string' && id.trim() ? id.trim() : null
}

/**
 * Resolve registry Report id for a ReportRun: job.autoRunReportId first, else
 * pdfUrl match with priority url → sourceUrl → s3Url (same as migration backfill).
 */
export async function resolveRegistryReportIdForRun(input: {
  jobData: unknown
  pdfUrl: string
}): Promise<string | null> {
  const fromJob = registryReportIdFromJobData(input.jobData)
  if (fromJob) return fromJob

  const pdfUrl = input.pdfUrl.trim()
  if (!pdfUrl) return null

  const byUrl = await prisma.report.findFirst({
    where: { url: pdfUrl },
    select: { id: true },
  })
  if (byUrl) return byUrl.id

  const bySource = await prisma.report.findFirst({
    where: { sourceUrl: pdfUrl },
    select: { id: true },
  })
  if (bySource) return bySource.id

  const byS3 = await prisma.report.findFirst({
    where: { s3Url: pdfUrl },
    select: { id: true },
    orderBy: { id: 'asc' },
  })
  return byS3?.id ?? null
}

/** Fields to sync onto an existing ReportRun from the latest job snapshot. */
export function reportRunSyncFieldsFromJob(input: {
  companyName?: string | null
  companyId?: string | null
  wikidataId?: string | null
  companyReportId?: string | null
  batchDbId?: string | null
  registryReportId?: string | null
}) {
  return {
    companyName: input.companyName ?? undefined,
    ...(input.companyId ? { companyId: input.companyId } : {}),
    ...(input.wikidataId ? { wikidataId: input.wikidataId } : {}),
    ...(input.companyReportId
      ? { companyReportId: input.companyReportId }
      : {}),
    ...(input.batchDbId ? { batchDbId: input.batchDbId } : {}),
    ...(input.registryReportId
      ? { registryReportId: input.registryReportId }
      : {}),
  }
}

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

/**
 * After a successful reporting-period save, align archive rows with the
 * CompanyReport id the API actually linked (Validate overview matches on this).
 */
export async function syncReportRunCompanyReportId(
  threadId: string | undefined,
  companyReportId: string
): Promise<number> {
  const normalizedThreadId = threadId?.trim()
  const normalizedReportId = companyReportId.trim()
  if (!normalizedThreadId || !normalizedReportId) return 0

  const result = await prisma.reportRun.updateMany({
    where: { threadId: normalizedThreadId },
    data: { companyReportId: normalizedReportId },
  })
  return result.count
}
