import { Queue } from 'bullmq'
import redis from '../config/redis'
import { prisma } from './prisma'

const GUESS_WIKIDATA_QUEUE = 'guessWikidata'

const GUESS_WIKIDATA_TERMINAL_STATES = new Set(['completed', 'failed'])

export type CanonicalCompanyIdSource = 'report_run' | 'job_data'

export type CanonicalCompanyId = {
  companyId: string
  source: CanonicalCompanyIdSource
}

export type SyncReportRunCompanyInput = {
  threadId: string
  companyId: string
  pdfUrl?: string | null
  companyName?: string | null
  wikidataId?: string | null
}

export async function syncCanonicalReportRunCompanyId(
  input: SyncReportRunCompanyInput
): Promise<void> {
  const threadId = input.threadId.trim()
  const companyId = input.companyId.trim()
  if (!threadId || !companyId) return

  const pdfUrl = input.pdfUrl?.trim()
  const data = {
    companyId,
    companyName: input.companyName ?? undefined,
    wikidataId: input.wikidataId ?? undefined,
  }

  if (!pdfUrl) {
    await prisma.reportRun.updateMany({
      where: { threadId },
      data,
    })
    return
  }

  await prisma.reportRun.upsert({
    where: { threadId },
    create: {
      threadId,
      pdfUrl,
      companyId,
      companyName: input.companyName ?? null,
      wikidataId: input.wikidataId ?? null,
    },
    update: data,
  })
}

export async function getCanonicalCompanyIdForThread(
  threadId: string | undefined,
  fallbackCompanyId: string
): Promise<CanonicalCompanyId> {
  const normalizedThreadId = threadId?.trim()
  const normalizedFallback = fallbackCompanyId.trim()
  if (!normalizedThreadId) {
    return { companyId: normalizedFallback, source: 'job_data' }
  }

  const reportRun = await prisma.reportRun.findUnique({
    where: { threadId: normalizedThreadId },
    select: { companyId: true },
  })

  const canonicalCompanyId = reportRun?.companyId?.trim()
  if (canonicalCompanyId) {
    return { companyId: canonicalCompanyId, source: 'report_run' }
  }

  return { companyId: normalizedFallback, source: 'job_data' }
}

async function listGuessWikidataJobsForThread(threadId: string) {
  const queue = new Queue(GUESS_WIKIDATA_QUEUE, { connection: redis })
  try {
    const jobs = await queue.getJobs([
      'delayed',
      'waiting',
      'active',
      'prioritized',
      'waiting-children',
      'completed',
      'failed',
    ])
    return jobs.filter((job) => job.data?.threadId === threadId)
  } finally {
    await queue.close()
  }
}

function isCompanyLinkApprovalPending(jobData: unknown): boolean {
  if (!jobData || typeof jobData !== 'object') return false
  const approval = (
    jobData as { approval?: { type?: string; approved?: boolean } }
  ).approval
  return approval?.type === 'companyLink' && approval.approved !== true
}

/**
 * True while guessWikidata is waiting on a companyLink approval for this thread.
 * Does not block saves for ordinary Wikidata approval delays.
 */
export async function isCompanyLinkResolutionPendingForThread(
  threadId: string
): Promise<boolean> {
  const normalizedThreadId = threadId.trim()
  if (!normalizedThreadId) return false

  const jobs = await listGuessWikidataJobsForThread(normalizedThreadId)
  if (jobs.length === 0) return false

  for (const job of jobs) {
    if (!isCompanyLinkApprovalPending(job.data)) continue

    const state = await job.getState()
    if (!GUESS_WIKIDATA_TERMINAL_STATES.has(state)) {
      return true
    }
  }

  return false
}

/** @deprecated Prefer isCompanyLinkResolutionPendingForThread for save gating. */
export async function isGuessWikidataPendingForThread(
  threadId: string
): Promise<boolean> {
  return isCompanyLinkResolutionPendingForThread(threadId)
}
