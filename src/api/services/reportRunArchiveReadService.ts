import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'

const jobListSelect = {
  jobId: true,
  queueName: true,
  status: true,
  failedReason: true,
  startedAt: true,
  finishedAt: true,
} as const

const batchListSelect = {
  id: true,
  batchName: true,
} as const

function buildListWhere(args: {
  q?: string
  batchDbId?: string
  /** Exact match on `Batch.batchName` (same string as pipeline `job.data.batchId`). */
  batchName?: string
}): Prisma.ReportRunWhereInput {
  const { q, batchDbId, batchName } = args
  const qTrim = q?.trim()
  const batchDbTrim = batchDbId?.trim()
  const batchNameTrim = batchName?.trim()

  const textWhere: Prisma.ReportRunWhereInput | null = qTrim
    ? {
        OR: [
          { threadId: { contains: qTrim, mode: 'insensitive' } },
          { companyName: { contains: qTrim, mode: 'insensitive' } },
          { wikidataId: { contains: qTrim, mode: 'insensitive' } },
          { pdfUrl: { contains: qTrim, mode: 'insensitive' } },
          {
            batch: {
              is: {
                OR: [
                  { batchName: { contains: qTrim, mode: 'insensitive' } },
                  { id: { contains: qTrim, mode: 'insensitive' } },
                ],
              },
            },
          },
        ],
      }
    : null

  const batchFkWhere: Prisma.ReportRunWhereInput | null = batchDbTrim
    ? { batchDbId: batchDbTrim }
    : null

  const batchNameWhere: Prisma.ReportRunWhereInput | null = batchNameTrim
    ? { batch: { is: { batchName: batchNameTrim } } }
    : null

  const batchPick = batchFkWhere ?? batchNameWhere

  const parts: Prisma.ReportRunWhereInput[] = []
  if (textWhere) parts.push(textWhere)
  if (batchPick) parts.push(batchPick)

  if (parts.length === 0) return {}
  if (parts.length === 1) return parts[0] as Prisma.ReportRunWhereInput
  return { AND: parts }
}

export async function listArchivedBatches(limit = 400) {
  const cap = Math.min(2000, Math.max(1, limit))
  const batches = await prisma.batch.findMany({
    orderBy: { batchName: 'asc' },
    take: cap,
    select: batchListSelect,
  })
  return { batches }
}

export async function listArchivedReportRuns(params: {
  page: number
  pageSize: number
  q?: string
  /** Stable Garbo `Batch.id` (cuid). */
  batchDbId?: string
  /** Exact pipeline batch string (`Batch.batchName`) when filtering without a known cuid. */
  batchName?: string
}) {
  const page = Math.max(1, params.page)
  const pageSize = Math.min(100, Math.max(1, params.pageSize))
  const skip = (page - 1) * pageSize
  const where = buildListWhere({
    q: params.q,
    batchDbId: params.batchDbId,
    batchName: params.batchName,
  })

  const [total, runs] = await Promise.all([
    prisma.reportRun.count({ where }),
    prisma.reportRun.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        batch: { select: batchListSelect },
        jobs: {
          orderBy: { finishedAt: 'asc' },
          select: jobListSelect,
        },
      },
    }),
  ])

  return { total, page, pageSize, runs }
}

export async function getArchivedReportRunByThreadId(threadId: string) {
  const run = await prisma.reportRun.findUnique({
    where: { threadId },
    include: {
      batch: { select: batchListSelect },
      jobs: { orderBy: { finishedAt: 'asc' } },
    },
  })
  if (!run) return null
  return run
}
