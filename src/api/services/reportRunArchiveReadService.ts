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

function buildListWhere(
  q?: string,
  batchId?: string
): Prisma.ReportRunWhereInput {
  const qTrim = q?.trim()
  const batchTrim = batchId?.trim()

  const textWhere: Prisma.ReportRunWhereInput | null = qTrim
    ? {
        OR: [
          { threadId: { contains: qTrim, mode: 'insensitive' } },
          { companyName: { contains: qTrim, mode: 'insensitive' } },
          { wikidataId: { contains: qTrim, mode: 'insensitive' } },
          { pdfUrl: { contains: qTrim, mode: 'insensitive' } },
          { batchId: { contains: qTrim, mode: 'insensitive' } },
        ],
      }
    : null

  const batchWhere: Prisma.ReportRunWhereInput | null = batchTrim
    ? { batchId: batchTrim }
    : null

  if (textWhere && batchWhere) {
    return { AND: [textWhere, batchWhere] }
  }
  if (textWhere) return textWhere
  if (batchWhere) return batchWhere
  return {}
}

export async function listArchivedReportRunBatchIds(
  limit = 400
): Promise<string[]> {
  const cap = Math.min(2000, Math.max(1, limit))
  const rows = await prisma.reportRun.findMany({
    where: { batchId: { not: null } },
    select: { batchId: true },
    distinct: ['batchId'],
    orderBy: { batchId: 'asc' },
    take: cap,
  })
  return rows
    .map((r) => r.batchId)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
}

export async function listArchivedReportRuns(params: {
  page: number
  pageSize: number
  q?: string
  batchId?: string
}) {
  const page = Math.max(1, params.page)
  const pageSize = Math.min(100, Math.max(1, params.pageSize))
  const skip = (page - 1) * pageSize
  const where = buildListWhere(params.q, params.batchId)

  const [total, runs] = await Promise.all([
    prisma.reportRun.count({ where }),
    prisma.reportRun.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip,
      take: pageSize,
      include: {
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
      jobs: { orderBy: { finishedAt: 'asc' } },
    },
  })
  if (!run) return null
  return run
}
