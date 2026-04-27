/**
 * One-off backfill: copy completed/failed BullMQ jobs from Redis into Postgres
 * (`ReportRun`, `ReportRunJob`) using the same shape as `src/startWorkers.ts`.
 *
 * Prerequisites: `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`, and optional `REDIS_PASSWORD`
 * (see `src/config/redis.ts`).
 *
 * Usage:
 *   npx tsx scripts/backfill-report-runs-from-bullmq.ts
 *   npx tsx scripts/backfill-report-runs-from-bullmq.ts --dry-run
 *   npx tsx scripts/backfill-report-runs-from-bullmq.ts --queues=parsePdf,saveToAPI
 *   npx tsx scripts/backfill-report-runs-from-bullmq.ts --reconcile-only
 *
 * Safe to re-run: skips rows that already exist for the same BullMQ `(queueName, jobId)`.
 */

import 'dotenv/config'
import type { Job } from 'bullmq'
import { Queue } from 'bullmq'
import type { Prisma } from '@prisma/client'
import redis from '../src/config/redis'
import { prisma } from '../src/lib/prisma'
import { QUEUE_NAMES } from '../src/queues'

const ALL_QUEUE_NAMES = [...new Set(Object.values(QUEUE_NAMES))] as string[]

type CliOptions = {
  dryRun: boolean
  reconcileOnly: boolean
  queueFilter: Set<string> | null
  chunkSize: number
}

function parseArgs(argv: string[]): CliOptions {
  const dryRun = argv.includes('--dry-run')
  const reconcileOnly = argv.includes('--reconcile-only')
  const queuesArg = argv.find((a) => a.startsWith('--queues='))
  const queueFilter = queuesArg
    ? new Set(
        queuesArg
          .slice('--queues='.length)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      )
    : null
  const chunkArg = argv.find((a) => a.startsWith('--chunk='))
  const chunkSize = chunkArg
    ? Math.max(1, parseInt(chunkArg.slice('--chunk='.length), 10) || 500)
    : 500
  return { dryRun, reconcileOnly, queueFilter, chunkSize }
}

function parseReturnValue(job: {
  returnvalue?: unknown
}): Record<string, unknown> | null {
  if (job.returnvalue == null) return null
  try {
    return typeof job.returnvalue === 'string'
      ? (JSON.parse(job.returnvalue) as Record<string, unknown>)
      : (job.returnvalue as Record<string, unknown>)
  } catch {
    return null
  }
}

function metadataFromReturnValue(rv: Record<string, unknown> | null): {
  prompt: string | null
  queryTexts: unknown
  markdown: string | null
} {
  if (!rv) {
    return { prompt: null, queryTexts: null, markdown: null }
  }
  const meta = rv.metadata
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    return { prompt: null, queryTexts: null, markdown: null }
  }
  const m = meta as Record<string, unknown>
  const prompt = typeof m.prompt === 'string' ? m.prompt : null
  const queryTexts = m.queryTexts ?? null
  const markdown = typeof m.context === 'string' ? m.context : null
  return { prompt, queryTexts, markdown }
}

async function resolvePdfUrl(
  data: Record<string, unknown> | undefined,
  threadId: string | null,
): Promise<string | null> {
  const raw = data?.url
  const direct = typeof raw === 'string' ? raw.trim() : ''
  if (direct) return direct
  if (threadId) {
    const existing = await prisma.reportRun.findUnique({
      where: { threadId },
      select: { pdfUrl: true },
    })
    if (existing?.pdfUrl) return existing.pdfUrl
  }
  return null
}

function threadIdFromData(data: Record<string, unknown> | undefined): string | null {
  const t = data?.threadId
  return typeof t === 'string' && t.trim() ? t.trim() : null
}

function wikidataNodeFromData(
  data: Record<string, unknown> | undefined,
): string | null {
  const w = data?.wikidata
  if (w && typeof w === 'object' && !Array.isArray(w)) {
    const node = (w as Record<string, unknown>).node
    if (typeof node === 'string' && node.trim()) return node.trim()
  }
  return null
}

function companyNameFromData(data: Record<string, unknown> | undefined): string | null {
  const n = data?.companyName
  return typeof n === 'string' && n.trim() ? n.trim() : null
}

async function persistJobIfNeeded(args: {
  job: Job
  queueName: string
  status: 'completed' | 'failed'
  dryRun: boolean
}): Promise<'inserted' | 'skipped' | 'error'> {
  const { job, queueName, status, dryRun } = args
  const jobId = job.id != null ? String(job.id) : null
  if (!jobId) return 'skipped'

  const existingRow = await prisma.reportRunJob.findFirst({
    where: { queueName, jobId },
    select: { id: true },
  })
  if (existingRow) return 'skipped'

  const data = job.data as Record<string, unknown> | undefined
  const threadId = threadIdFromData(data)
  if (!threadId) return 'skipped'

  const pdfUrl = await resolvePdfUrl(data, threadId)
  if (!pdfUrl) return 'skipped'

  const wikidataId = wikidataNodeFromData(data)
  const companyName = companyNameFromData(data)
  const returnValue = parseReturnValue(job)
  const { prompt, queryTexts, markdown } = metadataFromReturnValue(returnValue)

  const failedReason =
    status === 'failed' && typeof job.failedReason === 'string'
      ? job.failedReason
      : null

  const startedAt =
    typeof job.processedOn === 'number' ? new Date(job.processedOn) : null
  const finishedAt =
    typeof job.finishedOn === 'number'
      ? new Date(job.finishedOn)
      : new Date()

  const queryTextsJson: Prisma.InputJsonValue | undefined =
    queryTexts === null || queryTexts === undefined
      ? undefined
      : (queryTexts as Prisma.InputJsonValue)

  if (dryRun) {
    console.log(
      `[dry-run] would upsert run ${threadId} + job ${queueName}/${jobId} (${status})`,
    )
    return 'inserted'
  }

  try {
    const reportRun = await prisma.reportRun.upsert({
      where: { threadId },
      create: { threadId, pdfUrl, companyName, wikidataId },
      update: {
        companyName: companyName ?? undefined,
        wikidataId: wikidataId ?? undefined,
      },
    })

    await prisma.reportRunJob.create({
      data: {
        jobId,
        queueName,
        status,
        failedReason,
        prompt,
        queryTexts: queryTextsJson,
        markdown,
        startedAt,
        finishedAt,
        reportRunId: reportRun.id,
      },
    })
    return 'inserted'
  } catch (e) {
    console.error(`[backfill] error ${queueName}/${jobId}:`, e)
    return 'error'
  }
}

async function walkQueueStates(args: {
  queueName: string
  statuses: ('completed' | 'failed')[]
  chunkSize: number
  dryRun: boolean
}): Promise<{ inserted: number; skipped: number; errors: number }> {
  const { queueName, statuses, chunkSize, dryRun } = args
  const queue = new Queue(queueName, { connection: redis })
  const tallies = { inserted: 0, skipped: 0, errors: 0 }

  try {
    for (const status of statuses) {
      let start = 0
      while (true) {
        const jobs = await queue.getJobs([status], start, start + chunkSize - 1)
        if (!jobs.length) break

        const sorted = jobs.slice().sort((a, b) => {
          const fa = a.finishedOn ?? a.processedOn ?? 0
          const fb = b.finishedOn ?? b.processedOn ?? 0
          return fa - fb
        })

        for (const job of sorted) {
          const r = await persistJobIfNeeded({
            job,
            queueName,
            status,
            dryRun,
          })
          if (r === 'inserted') tallies.inserted++
          else if (r === 'skipped') tallies.skipped++
          else tallies.errors++
        }

        start += jobs.length
        if (jobs.length < chunkSize) break
      }
    }
  } finally {
    await queue.close()
  }

  return tallies
}

/**
 * Align `ReportRun.status` with imported jobs (same coarse rule as live workers:
 * any failure → failed; else sendCompanyLink completed → completed; else running).
 */
async function reconcileReportRunStatuses(): Promise<void> {
  const jobs = await prisma.reportRunJob.findMany({
    select: { reportRunId: true, queueName: true, status: true },
  })

  const acc = new Map<string, { anyFailed: boolean; sendCompleted: boolean }>()
  for (const j of jobs) {
    const cur = acc.get(j.reportRunId) ?? { anyFailed: false, sendCompleted: false }
    if (j.status === 'failed') cur.anyFailed = true
    if (j.queueName === QUEUE_NAMES.SEND_COMPANY_LINK && j.status === 'completed') {
      cur.sendCompleted = true
    }
    acc.set(j.reportRunId, cur)
  }

  for (const [reportRunId, { anyFailed, sendCompleted }] of acc) {
    const status = anyFailed ? 'failed' : sendCompleted ? 'completed' : 'running'
    await prisma.reportRun.update({
      where: { id: reportRunId },
      data: { status },
    })
  }

  console.log(`[backfill] reconciled status for ${acc.size} report runs`)
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  const queuesToScan = ALL_QUEUE_NAMES.filter(
    (q) => !opts.queueFilter || opts.queueFilter.has(q),
  )

  if (opts.queueFilter) {
    const unknown = [...opts.queueFilter].filter((q) => !ALL_QUEUE_NAMES.includes(q))
    if (unknown.length) {
      console.error('Unknown queue names:', unknown.join(', '))
      process.exit(1)
    }
  }

  console.log(
    `[backfill] queues=${queuesToScan.length} dryRun=${opts.dryRun} reconcileOnly=${opts.reconcileOnly} chunk=${opts.chunkSize}`,
  )

  if (opts.reconcileOnly) {
    await reconcileReportRunStatuses()
    return
  }

  const grand = { inserted: 0, skipped: 0, errors: 0 }
  for (const queueName of queuesToScan) {
    console.log(`[backfill] scanning ${queueName}...`)
    const t = await walkQueueStates({
      queueName,
      statuses: ['completed', 'failed'],
      chunkSize: opts.chunkSize,
      dryRun: opts.dryRun,
    })
    grand.inserted += t.inserted
    grand.skipped += t.skipped
    grand.errors += t.errors
    console.log(`[backfill] ${queueName}:`, t)
  }

  console.log('[backfill] import totals:', grand)

  if (!opts.dryRun) {
    await reconcileReportRunStatuses()
  } else {
    console.log('[dry-run] skipping status reconciliation')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
