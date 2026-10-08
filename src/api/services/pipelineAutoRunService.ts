import { Prisma } from '@prisma/client'
import { Job, Queue } from 'bullmq'
import redis from '../../config/redis'
import doclingConfig from '../../config/docling'
import { prisma } from '../../lib/prisma'
import { queues } from '../../queues'
import { withPipelineJobOpts } from '../../lib/pipelineJobOptions'
import { resolveReportBatchDbId } from '../../lib/reportRunPersistence'
import {
  AUTO_RUN_SLOT_QUEUES,
  AUTO_RUN_APPROVAL_QUEUES,
  DOCLING_FAILURE_AUTO_OFF,
  REPORT_FAILURE_AUTO_OFF,
  foldAutoRunOutcomeEvents,
  pipelineAutoRunFiltersSchema,
  pipelineAutoRunOptionsSchema,
  type AutoRunOutcomeEvent,
  type PipelineAutoRunFilters,
  type PipelineAutoRunOptions,
  type PipelineAutoRunPatch,
  type PipelineAutoRunStatus,
  reportRunnableUrl,
  pickCandidatesFromPage,
  emissionsPresenceCandidateFilter,
  linkedReportRunExclusion,
} from './pipelineAutoRunTypes'
import { tryWithPipelineAutoRunTickLock } from '../../lib/pipelineAutoRunLock'

const CONFIG_ID = 'default'

type ConfigRow = {
  id: string
  enabled: boolean
  maxConcurrent: number
  filters: unknown
  runOptions: unknown
  consecutiveDoclingFailures: number
  consecutiveReportFailures: number
  pausedReason: string | null
  disabledReason: string | null
  lastTickAt: Date | null
  lastEnqueuedAt: Date | null
  outcomeObservedThrough: Date | null
  lastError: string | null
  updatedBy: string | null
  updatedAt: Date
}

function parseFilters(raw: unknown): PipelineAutoRunFilters {
  const parsed = pipelineAutoRunFiltersSchema.safeParse(
    raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  )
  if (parsed.success) return parsed.data
  return pipelineAutoRunFiltersSchema.parse({})
}

function parseOptions(raw: unknown): PipelineAutoRunOptions {
  const parsed = pipelineAutoRunOptionsSchema.safeParse(
    raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  )
  return normalizeRunOptions(
    parsed.success ? parsed.data : pipelineAutoRunOptionsSchema.parse({})
  )
}

/** Drop cleared batchId so stored JSON and enqueue both treat it as unset. */
function normalizeRunOptions(
  options: PipelineAutoRunOptions
): PipelineAutoRunOptions {
  if (options.batchId != null) return options
  const { batchId: _cleared, ...rest } = options
  return rest
}

export async function ensurePipelineAutoRunConfig(): Promise<ConfigRow> {
  const existing = await prisma.pipelineAutoRunConfig.findUnique({
    where: { id: CONFIG_ID },
  })
  if (existing) return existing as ConfigRow
  return (await prisma.pipelineAutoRunConfig.create({
    data: { id: CONFIG_ID },
  })) as ConfigRow
}

async function withBudget<T>(
  work: Promise<T>,
  ms: number,
  fallback: T
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      work,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function getPipelineAutoRunStatus(): Promise<PipelineAutoRunStatus> {
  const row = await ensurePipelineAutoRunConfig()
  const filters = parseFilters(row.filters)
  const runOptions = parseOptions(row.runOptions)
  // Status polls must stay under proxy budgets. Tick path still uses full
  // Redis queue scans for concurrency gating; GET approximates active via DB
  // and caps Redis/Docling probes so Validate polling cannot 500/504.
  const [activelyProcessing, parkedOnApproval, remainingEstimate, docling] =
    await Promise.all([
      countRunningAutoRunClaims().catch(() => 0),
      withBudget(
        countParkedOnApprovalAutoRuns().catch(() => 0),
        2_000,
        0
      ),
      withBudget(estimateRemainingCandidates(filters, runOptions), 2_000, null),
      withBudget(
        checkDoclingReachable().catch(() => null),
        3_000,
        null
      ),
    ])

  return {
    enabled: row.enabled,
    maxConcurrent: row.maxConcurrent,
    filters,
    runOptions,
    consecutiveDoclingFailures: row.consecutiveDoclingFailures,
    consecutiveReportFailures: row.consecutiveReportFailures,
    pausedReason: row.pausedReason,
    disabledReason: row.disabledReason,
    lastTickAt: row.lastTickAt?.toISOString() ?? null,
    lastEnqueuedAt: row.lastEnqueuedAt?.toISOString() ?? null,
    lastError: row.lastError,
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt.toISOString(),
    activelyProcessing,
    parkedOnApproval,
    remainingEstimate,
    doclingReachable: docling,
  }
}

export async function patchPipelineAutoRunConfig(
  patch: PipelineAutoRunPatch,
  updatedBy?: string | null
): Promise<PipelineAutoRunStatus> {
  const row = await ensurePipelineAutoRunConfig()
  const currentFilters = parseFilters(row.filters)
  const currentOptions = parseOptions(row.runOptions)

  const nextEnabled = patch.enabled ?? row.enabled
  const enabling = patch.enabled === true && !row.enabled
  const resetCounters = patch.resetFailureCounters ?? (enabling ? true : false)

  const nextFilters = patch.filters
    ? parseFilters({ ...currentFilters, ...patch.filters })
    : currentFilters
  // null batchId means "clear" (JSON omits undefined, so clients must send null).
  const nextOptions = patch.runOptions
    ? normalizeRunOptions(
        parseOptions({ ...currentOptions, ...patch.runOptions })
      )
    : currentOptions

  await prisma.pipelineAutoRunConfig.update({
    where: { id: CONFIG_ID },
    data: {
      enabled: nextEnabled,
      ...(patch.maxConcurrent !== undefined
        ? { maxConcurrent: patch.maxConcurrent }
        : {}),
      filters: nextFilters as Prisma.InputJsonValue,
      runOptions: nextOptions as Prisma.InputJsonValue,
      ...(resetCounters
        ? {
            consecutiveDoclingFailures: 0,
            consecutiveReportFailures: 0,
            // Fresh streak: ignore failures that already finished (or are still
            // finishing) from the run that soft-disabled us, so re-enable is not
            // immediately undone by the next observe tick.
            outcomeObservedThrough: new Date(),
          }
        : {}),
      ...(enabling || patch.enabled === true
        ? { disabledReason: null, pausedReason: null, lastError: null }
        : {}),
      ...(updatedBy ? { updatedBy } : {}),
    },
  })

  return getPipelineAutoRunStatus()
}

function jobIsAutoRun(job: Job): boolean {
  return Boolean((job.data as { autoRun?: unknown } | undefined)?.autoRun)
}

function jobIsWaitingForApproval(job: Job): boolean {
  const data = job.data as {
    waitingForCompanyName?: unknown
    approval?: { approved?: unknown }
  }
  if (data?.waitingForCompanyName === true) return true
  if (
    data?.approval &&
    typeof data.approval === 'object' &&
    data.approval.approved !== true
  ) {
    return true
  }
  return false
}

/** Running auto-run rows older than this are treated as abandoned (crash between claim and progress). */
const STALE_RUNNING_CLAIM_MS = 6 * 60 * 60 * 1000
const CANDIDATE_PAGE_SIZE = 100
/** Poison/in-flight exclusion is SQL (registryReportId); page budget stays modest. */
const CANDIDATE_MAX_PAGES = 50
const QUEUE_JOB_PAGE_SIZE = 500
/** Keep Redis scans bounded — ~36 slot queues × pages can wedge a tick. */
const QUEUE_JOB_MAX_PAGES = 2
/** Whole locked tick must finish or fail so concurrency:1 cannot wedge forever. */
const TICK_LOCK_TIMEOUT_MS = 90_000
const QUEUE_SCAN_TIMEOUT_MS = 20_000

async function withTimeout<T>(
  work: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      work,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${ms}ms`)),
          ms
        )
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

async function getJobsFromQueues(
  queueNames: readonly string[],
  statuses: Array<'waiting' | 'active' | 'delayed' | 'paused'>
): Promise<{ queueName: string; job: Job }[]> {
  return withTimeout(
    (async () => {
      const out: { queueName: string; job: Job }[] = []
      for (const queueName of queueNames) {
        const q = new Queue(queueName, { connection: redis })
        try {
          for (let page = 0; page < QUEUE_JOB_MAX_PAGES; page++) {
            const start = page * QUEUE_JOB_PAGE_SIZE
            const end = start + QUEUE_JOB_PAGE_SIZE - 1
            const jobs = await q.getJobs([...statuses], start, end)
            for (const job of jobs) {
              if (job) out.push({ queueName, job })
            }
            if (jobs.length < QUEUE_JOB_PAGE_SIZE) break
          }
        } finally {
          await q.close().catch(() => undefined)
        }
      }
      return out
    })(),
    QUEUE_SCAN_TIMEOUT_MS,
    `queue scan (${statuses.join(',')})`
  )
}

/**
 * Auto-run jobs that occupy a concurrency slot: any mid-pipeline work except
 * delayed jobs waiting for staff approval (those free the slot for Docling).
 */
export async function countActivelyProcessingAutoRuns(): Promise<number> {
  const [activeish, delayed] = await Promise.all([
    getJobsFromQueues(AUTO_RUN_SLOT_QUEUES, ['waiting', 'active', 'paused']),
    getJobsFromQueues(AUTO_RUN_SLOT_QUEUES, ['delayed']),
  ])
  const threadIds = new Set<string>()
  const add = (job: Job) => {
    const threadId = (job.data as { threadId?: string })?.threadId
    if (threadId) threadIds.add(threadId)
    else threadIds.add(job.id ?? job.name)
  }
  for (const { job } of activeish) {
    if (!jobIsAutoRun(job)) continue
    add(job)
  }
  for (const { job } of delayed) {
    if (!jobIsAutoRun(job)) continue
    // Parked on human approval — free the slot so Docling can keep draining.
    if (jobIsWaitingForApproval(job)) continue
    add(job)
  }
  return threadIds.size
}

/** Cheap status metric: fresh auto-run ReportRun rows still marked running. */
async function countRunningAutoRunClaims(): Promise<number> {
  const staleBefore = new Date(Date.now() - STALE_RUNNING_CLAIM_MS)
  return prisma.reportRun.count({
    where: {
      autoRun: true,
      status: 'running',
      updatedAt: { gte: staleBefore },
    },
  })
}

export async function countParkedOnApprovalAutoRuns(): Promise<number> {
  const jobs = await getJobsFromQueues(AUTO_RUN_APPROVAL_QUEUES, ['delayed'])
  const threadIds = new Set<string>()
  for (const { job } of jobs) {
    if (!jobIsAutoRun(job)) continue
    if (!jobIsWaitingForApproval(job)) continue
    const threadId = (job.data as { threadId?: string })?.threadId
    if (threadId) threadIds.add(threadId)
  }
  return threadIds.size
}

/**
 * Live queue URLs + unlinked poison/in-flight runs. Linked terminals are
 * excluded in SQL via registryReportId; this net covers rows the migration
 * missed or that were created before the FK was wired on every path.
 */
async function collectLiveClaimedPdfUrls(
  staleBefore: Date
): Promise<Set<string>> {
  const claimed = new Set<string>()

  const unlinkedPoison = await prisma.reportRun.findMany({
    where: {
      registryReportId: null,
      OR: [
        { status: 'running', updatedAt: { gte: staleBefore } },
        { status: 'skipped_no_emissions' },
        { status: 'completed' },
        { status: 'failed', autoRun: true },
      ],
    },
    select: { pdfUrl: true },
  })
  for (const run of unlinkedPoison) {
    if (run.pdfUrl) claimed.add(run.pdfUrl)
  }

  const live = await getJobsFromQueues(AUTO_RUN_SLOT_QUEUES, [
    'waiting',
    'active',
    'delayed',
    'paused',
  ])
  for (const { job } of live) {
    const url = (job.data as { url?: string })?.url
    if (typeof url === 'string' && url.trim()) claimed.add(url.trim())
    const sourceUrl = (job.data as { sourceUrl?: string })?.sourceUrl
    if (typeof sourceUrl === 'string' && sourceUrl.trim()) {
      claimed.add(sourceUrl.trim())
    }
  }

  return claimed
}

function buildReportFilterWhere(
  filters: PipelineAutoRunFilters,
  runOptions: PipelineAutoRunOptions,
  staleBefore: Date
): Prisma.ReportWhereInput {
  const parts: Prisma.ReportWhereInput[] = [{ companyReports: { none: {} } }]
  // When requireEmissionsPresence is on: skip known-false only. Null (Not
  // checked) must enqueue so Docling + checkEmissionsPresence can populate it.
  if (runOptions.requireEmissionsPresence) {
    parts.push(emissionsPresenceCandidateFilter())
  }
  // Indexed anti-join: no linked poison / in-flight ReportRun on this report.
  parts.push(linkedReportRunExclusion(staleBefore))
  if (filters.reportTypeIds.length) {
    parts.push({ reportTypeId: { in: filters.reportTypeIds } })
  }
  if (filters.registryBatchIds.length) {
    parts.push({ batchId: { in: filters.registryBatchIds } })
  }
  if (filters.coverageListIds.length) {
    parts.push({
      coverageEntryReports: {
        some: {
          linkStatus: 'matched',
          entry: {
            year: { listId: { in: filters.coverageListIds } },
          },
        },
      },
    })
  }
  return { AND: parts }
}

type CandidateReportRow = {
  id: string
  url: string
  sourceUrl: string | null
  s3Url: string | null
  companyName: string | null
  wikidataId: string | null
}

export async function selectAutoRunCandidates(
  filters: PipelineAutoRunFilters,
  runOptions: PipelineAutoRunOptions,
  limit: number
): Promise<CandidateReportRow[]> {
  if (limit <= 0) return []

  const staleBefore = new Date(Date.now() - STALE_RUNNING_CLAIM_MS)
  const claimed = await collectLiveClaimedPdfUrls(staleBefore)
  const baseWhere = buildReportFilterWhere(filters, runOptions, staleBefore)

  const selected: CandidateReportRow[] = []
  let afterId: string | undefined
  for (
    let page = 0;
    page < CANDIDATE_MAX_PAGES && selected.length < limit;
    page++
  ) {
    const rows = await prisma.report.findMany({
      where: {
        AND: [baseWhere, ...(afterId ? [{ id: { gt: afterId } }] : [])],
      },
      orderBy: { id: 'asc' },
      take: CANDIDATE_PAGE_SIZE,
      select: {
        id: true,
        url: true,
        sourceUrl: true,
        s3Url: true,
        companyName: true,
        wikidataId: true,
      },
    })
    if (rows.length === 0) break
    afterId = rows[rows.length - 1]?.id

    const need = limit - selected.length
    const picked = pickCandidatesFromPage(rows, claimed, need)
    selected.push(...picked)
  }

  return selected
}

export async function estimateRemainingCandidates(
  filters: PipelineAutoRunFilters,
  runOptions: PipelineAutoRunOptions
): Promise<number | null> {
  try {
    // Same SQL filters as select (including linked poison anti-join) — no URL list load.
    const staleBefore = new Date(Date.now() - STALE_RUNNING_CLAIM_MS)
    return await prisma.report.count({
      where: buildReportFilterWhere(filters, runOptions, staleBefore),
    })
  } catch {
    return null
  }
}

export async function checkDoclingReachable(): Promise<boolean> {
  const base = doclingConfig.baseUrl.replace(/\/+$/, '')
  const candidates = [`${base}/health`, `${base}/`, base]
  for (const url of candidates) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 4_000)
      const res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      })
      clearTimeout(timer)
      // Any HTTP response (including 404/401) means the host is reachable.
      if (res.status > 0) return true
    } catch {
      // try next
    }
  }
  return false
}

async function softDisable(
  reason: string,
  extra?: { lastError?: string }
): Promise<void> {
  await prisma.pipelineAutoRunConfig.update({
    where: { id: CONFIG_ID },
    data: {
      enabled: false,
      disabledReason: reason,
      ...(extra?.lastError ? { lastError: extra.lastError } : {}),
    },
  })
}

/**
 * Observe recent auto-run outcomes and update failure counters / soft-disable.
 * Uses `outcomeObservedThrough` (not `lastTickAt`) so heartbeat updates cannot
 * double-count or skip jobs. Events are folded in time order so a success in
 * the same window as failures does not blindly wipe an earlier streak.
 */
export async function observeAutoRunOutcomes(): Promise<void> {
  const row = await ensurePipelineAutoRunConfig()
  const since =
    row.outcomeObservedThrough ??
    row.lastTickAt ??
    new Date(Date.now() - 10 * 60 * 1000)

  const [recentJobs, terminalRuns] = await Promise.all([
    prisma.reportRunJob.findMany({
      where: {
        finishedAt: { gt: since },
        reportRun: { autoRun: true },
      },
      select: {
        id: true,
        status: true,
        queueName: true,
        finishedAt: true,
      },
      orderBy: [{ finishedAt: 'asc' }, { id: 'asc' }],
      take: 500,
    }),
    prisma.reportRun.findMany({
      where: {
        autoRun: true,
        status: { in: ['completed', 'skipped_no_emissions'] },
        updatedAt: { gt: since },
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
      take: 200,
    }),
  ])

  const events: AutoRunOutcomeEvent[] = []
  let maxThrough = since.getTime()

  for (const job of recentJobs) {
    if (job.status !== 'failed' && job.status !== 'completed') continue
    const atMs = job.finishedAt.getTime()
    maxThrough = Math.max(maxThrough, atMs)
    events.push({
      atMs,
      id: `job:${job.id}`,
      kind: 'job',
      status: job.status,
      queueName: job.queueName,
    })
  }
  for (const run of terminalRuns) {
    if (run.status !== 'completed' && run.status !== 'skipped_no_emissions') {
      continue
    }
    const atMs = run.updatedAt.getTime()
    maxThrough = Math.max(maxThrough, atMs)
    events.push({
      atMs,
      id: `run:${run.id}`,
      kind: 'run',
      status: run.status,
    })
  }

  // While soft-disabled: keep the watermark moving so late failures from the
  // disabled batch are not replayed after re-enable, but do not write counters
  // (a concurrent enable reset must stick) and do not soft-disable again.
  if (!row.enabled) {
    if (events.length > 0) {
      await prisma.pipelineAutoRunConfig.update({
        where: { id: CONFIG_ID },
        data: { outcomeObservedThrough: new Date(maxThrough) },
      })
    }
    return
  }

  const folded = foldAutoRunOutcomeEvents(
    {
      doclingFails: row.consecutiveDoclingFailures,
      reportFails: row.consecutiveReportFailures,
    },
    events
  )

  await prisma.pipelineAutoRunConfig.update({
    where: { id: CONFIG_ID },
    data: {
      consecutiveDoclingFailures: folded.doclingFails,
      consecutiveReportFailures: folded.reportFails,
      ...(events.length > 0
        ? { outcomeObservedThrough: new Date(maxThrough) }
        : {}),
    },
  })

  // Re-read enabled: an operator may have re-enabled during this observe.
  const still = await ensurePipelineAutoRunConfig()
  if (!still.enabled) return

  if (folded.doclingFails >= DOCLING_FAILURE_AUTO_OFF) {
    await softDisable('docling_failures', {
      lastError: `Auto-disabled after ${folded.doclingFails} consecutive Docling failures`,
    })
  } else if (folded.reportFails >= REPORT_FAILURE_AUTO_OFF) {
    await softDisable('report_failures', {
      lastError: `Auto-disabled after ${folded.reportFails} consecutive report failures`,
    })
  }
}

export async function enqueueAutoRunReport(
  report: {
    id: string
    url: string
    sourceUrl: string | null
    s3Url: string | null
    companyName: string | null
    wikidataId: string | null
  },
  runOptions: PipelineAutoRunOptions
): Promise<{ threadId: string; jobId: string | undefined }> {
  const runnable = reportRunnableUrl(report)
  const threadId = crypto.randomUUID()

  let batchId = runOptions.batchId
  if (batchId) {
    // Normalize to stable Batch.id when possible; workers also accept batchName.
    const resolved = await resolveReportBatchDbId(batchId)
    if (resolved) {
      const batch = await prisma.batch.findUnique({
        where: { id: resolved },
        select: { id: true, batchName: true },
      })
      // Prefer batchName string for job.data.batchId (matches pipeline-api / Validate).
      batchId = batch?.batchName ?? batchId
    }
  }

  const jobData: Record<string, unknown> = {
    url: runnable.url,
    ...(runnable.sourceUrl ? { sourceUrl: runnable.sourceUrl } : {}),
    threadId,
    autoApprove: Boolean(runOptions.autoApprove),
    forceReindex: Boolean(runOptions.forceReindex),
    // Do not set replaceAllEmissions: candidates already have no CompanyReport,
    // and the staff HTTP API forbids replaceAllEmissions in production (403).
    autoRun: true,
    autoRunReportId: report.id,
    ...(runOptions.requireEmissionsPresence
      ? { requireEmissionsPresence: true }
      : {}),
    ...(runOptions.runOnly?.length ? { runOnly: runOptions.runOnly } : {}),
    ...(runOptions.tags?.length ? { tags: runOptions.tags } : {}),
    ...(batchId ? { batchId } : {}),
    ...(report.companyName ? { companyName: report.companyName } : {}),
    ...(report.wikidataId ? { wikidata: { node: report.wikidataId } } : {}),
  }

  // Create ReportRun early so candidate selection sees it as claimed.
  const batchDbId = await resolveReportBatchDbId(
    typeof batchId === 'string' ? batchId : null
  )
  await prisma.reportRun.create({
    data: {
      threadId,
      pdfUrl: runnable.url,
      companyName: report.companyName,
      wikidataId: report.wikidataId,
      batchDbId,
      registryReportId: report.id,
      autoRun: true,
      status: 'running',
    },
  })

  try {
    const job = await queues.parsePdf.add(
      'download ' + runnable.url.slice(-20),
      jobData as { url: string; threadId: string; autoApprove: boolean },
      withPipelineJobOpts({ attempts: 1 })
    )
    return { threadId, jobId: job.id }
  } catch (err) {
    await prisma.reportRun
      .update({
        where: { threadId },
        data: { status: 'failed' },
      })
      .catch(() => undefined)
    throw err
  }
}

/**
 * One ticker iteration: observe outcomes, Docling preflight, maybe enqueue.
 * Multi-replica safe via Redis tick lock (overlapping ticks skip enqueue).
 */
export async function runPipelineAutoRunTick(): Promise<{
  enqueued: number
  skippedReason?: string
}> {
  // Heartbeat before the Redis lock / observe work. If lastTickAt is frozen,
  // the pipelineAutoRun worker is not running (or not reaching this function).
  // Soft-disable does not stop ticks — only skips enqueue.
  await prisma.pipelineAutoRunConfig
    .update({
      where: { id: CONFIG_ID },
      data: { lastTickAt: new Date() },
    })
    .catch(() => undefined)

  let locked: Awaited<
    ReturnType<
      typeof tryWithPipelineAutoRunTickLock<{
        enqueued: number
        skippedReason?: string
      }>
    >
  >
  try {
    locked = await tryWithPipelineAutoRunTickLock(() =>
      withTimeout(
        runPipelineAutoRunTickLocked(),
        TICK_LOCK_TIMEOUT_MS,
        'pipeline-auto-run tick'
      )
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await prisma.pipelineAutoRunConfig.update({
      where: { id: CONFIG_ID },
      data: {
        lastError: message.includes('timed out')
          ? `Tick timed out — skipped enqueue: ${message}`
          : `Tick lock / Redis unavailable — skipped enqueue: ${message}`,
      },
    })
    return {
      enqueued: 0,
      skippedReason: message.includes('timed out')
        ? 'tick_timeout'
        : 'queue_unavailable',
    }
  }
  if (!locked.acquired) {
    return { enqueued: 0, skippedReason: 'tick_locked' }
  }
  return locked.result
}

async function runPipelineAutoRunTickLocked(): Promise<{
  enqueued: number
  skippedReason?: string
}> {
  await observeAutoRunOutcomes()
  const afterObserve = await ensurePipelineAutoRunConfig()

  const doclingOk = await checkDoclingReachable()
  if (!doclingOk) {
    await prisma.pipelineAutoRunConfig.update({
      where: { id: CONFIG_ID },
      data: {
        pausedReason: 'docling_unreachable',
        lastTickAt: new Date(),
        lastError: 'Docling unreachable — paused enqueueing',
      },
    })
  } else if (afterObserve.pausedReason === 'docling_unreachable') {
    await prisma.pipelineAutoRunConfig.update({
      where: { id: CONFIG_ID },
      data: {
        pausedReason: null,
        lastError: null,
        lastTickAt: new Date(),
      },
    })
  } else {
    await prisma.pipelineAutoRunConfig.update({
      where: { id: CONFIG_ID },
      data: { lastTickAt: new Date() },
    })
  }

  const latest = await ensurePipelineAutoRunConfig()
  if (!latest.enabled) {
    return { enqueued: 0, skippedReason: 'disabled' }
  }
  if (latest.pausedReason) {
    return { enqueued: 0, skippedReason: latest.pausedReason }
  }

  const filters = parseFilters(latest.filters)
  const runOptions = parseOptions(latest.runOptions)
  let active: number
  let candidates: Awaited<ReturnType<typeof selectAutoRunCandidates>>
  try {
    active = await countActivelyProcessingAutoRuns()
    const slots = Math.max(0, latest.maxConcurrent - active)
    if (slots <= 0) {
      return { enqueued: 0, skippedReason: 'at_capacity' }
    }
    candidates = await selectAutoRunCandidates(filters, runOptions, slots)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await prisma.pipelineAutoRunConfig.update({
      where: { id: CONFIG_ID },
      data: {
        lastError: `Queue read failed — skipped enqueue: ${message}`,
      },
    })
    return { enqueued: 0, skippedReason: 'queue_unavailable' }
  }

  let enqueued = 0
  for (const report of candidates) {
    try {
      await enqueueAutoRunReport(report, runOptions)
      enqueued += 1
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await prisma.pipelineAutoRunConfig.update({
        where: { id: CONFIG_ID },
        data: { lastError: message },
      })
      // Count enqueue failures toward report failures
      const refreshed = await ensurePipelineAutoRunConfig()
      const nextFails = refreshed.consecutiveReportFailures + 1
      if (nextFails >= REPORT_FAILURE_AUTO_OFF) {
        await softDisable('report_failures', { lastError: message })
      } else {
        await prisma.pipelineAutoRunConfig.update({
          where: { id: CONFIG_ID },
          data: { consecutiveReportFailures: nextFails },
        })
      }
      break
    }
  }

  if (enqueued > 0) {
    await prisma.pipelineAutoRunConfig.update({
      where: { id: CONFIG_ID },
      data: { lastEnqueuedAt: new Date(), lastError: null },
    })
  }

  return { enqueued }
}
