import { Prisma } from '@prisma/client'
import { Job, Queue } from 'bullmq'
import redis from '../../config/redis'
import doclingConfig from '../../config/docling'
import { prisma } from '../../lib/prisma'
import { queues } from '../../queues'
import { withPipelineJobOpts } from '../../lib/pipelineJobOptions'
import { resolveReportBatchDbId } from '../../lib/reportRunPersistence'
import {
  AUTO_RUN_ACTIVE_QUEUES,
  AUTO_RUN_APPROVAL_QUEUES,
  DOCLING_FAILURE_AUTO_OFF,
  REPORT_FAILURE_AUTO_OFF,
  pipelineAutoRunFiltersSchema,
  pipelineAutoRunOptionsSchema,
  type PipelineAutoRunFilters,
  type PipelineAutoRunOptions,
  type PipelineAutoRunPatch,
  type PipelineAutoRunStatus,
  reportRunnableUrl,
} from './pipelineAutoRunTypes'

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
  lastError: string | null
  updatedBy: string | null
  updatedAt: Date
}

function parseFilters(raw: unknown): PipelineAutoRunFilters {
  return pipelineAutoRunFiltersSchema.parse(raw ?? {})
}

function parseOptions(raw: unknown): PipelineAutoRunOptions {
  return pipelineAutoRunOptionsSchema.parse(raw ?? {})
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

export async function getPipelineAutoRunStatus(): Promise<PipelineAutoRunStatus> {
  const row = await ensurePipelineAutoRunConfig()
  const filters = parseFilters(row.filters)
  const runOptions = parseOptions(row.runOptions)
  const [activelyProcessing, parkedOnApproval, remainingEstimate, docling] =
    await Promise.all([
      countActivelyProcessingAutoRuns(),
      countParkedOnApprovalAutoRuns(),
      estimateRemainingCandidates(filters, runOptions),
      checkDoclingReachable(),
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
  const nextOptions = patch.runOptions
    ? parseOptions({ ...currentOptions, ...patch.runOptions })
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

function reportUrlVariants(report: {
  url: string
  sourceUrl: string | null
  s3Url: string | null
}): string[] {
  return [report.url, report.sourceUrl, report.s3Url]
    .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    .map((u) => u.trim())
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

async function getJobsFromQueues(
  queueNames: readonly string[],
  statuses: Array<'waiting' | 'active' | 'delayed' | 'paused'>
): Promise<{ queueName: string; job: Job }[]> {
  const out: { queueName: string; job: Job }[] = []
  for (const queueName of queueNames) {
    const q = new Queue(queueName, { connection: redis })
    try {
      const jobs = await q.getJobs([...statuses], 0, 499)
      for (const job of jobs) {
        if (job) out.push({ queueName, job })
      }
    } catch {
      // Queue may not exist yet (e.g. checkEmissionsPresence before that PR).
    } finally {
      await q.close().catch(() => undefined)
    }
  }
  return out
}

export async function countActivelyProcessingAutoRuns(): Promise<number> {
  const jobs = await getJobsFromQueues(AUTO_RUN_ACTIVE_QUEUES, [
    'waiting',
    'active',
    'delayed',
    'paused',
  ])
  const threadIds = new Set<string>()
  for (const { job } of jobs) {
    if (!jobIsAutoRun(job)) continue
    const threadId = (job.data as { threadId?: string })?.threadId
    if (threadId) threadIds.add(threadId)
    else threadIds.add(job.id ?? job.name)
  }
  return threadIds.size
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

async function collectClaimedPdfUrls(): Promise<Set<string>> {
  const claimed = new Set<string>()

  const openRuns = await prisma.reportRun.findMany({
    where: {
      OR: [
        { status: 'running' },
        // Terminal gate from emissions-presence PR — still "claimed" for re-enqueue.
        { status: 'skipped_no_emissions' },
      ],
    },
    select: { pdfUrl: true },
  })
  for (const run of openRuns) {
    if (run.pdfUrl) claimed.add(run.pdfUrl)
  }

  const live = await getJobsFromQueues(
    [...AUTO_RUN_ACTIVE_QUEUES, ...AUTO_RUN_APPROVAL_QUEUES],
    ['waiting', 'active', 'delayed', 'paused']
  )
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

export async function selectAutoRunCandidates(
  filters: PipelineAutoRunFilters,
  runOptions: PipelineAutoRunOptions,
  limit: number
): Promise<
  Array<{
    id: string
    url: string
    sourceUrl: string | null
    s3Url: string | null
    companyName: string | null
    wikidataId: string | null
  }>
> {
  if (limit <= 0) return []

  const claimed = await collectClaimedPdfUrls()

  // Avoid referencing hasEmissionsMentions until the column exists in the client.
  const baseWhere: Prisma.ReportWhereInput = {
    AND: [
      { companyReports: { none: {} } },
      ...(filters.reportTypeIds.length
        ? [{ reportTypeId: { in: filters.reportTypeIds } }]
        : []),
      ...(filters.registryBatchIds.length
        ? [{ batchId: { in: filters.registryBatchIds } }]
        : []),
      ...(filters.coverageListIds.length
        ? [
            {
              coverageEntryReports: {
                some: {
                  linkStatus: 'matched' as const,
                  entry: {
                    year: { listId: { in: filters.coverageListIds } },
                  },
                },
              },
            },
          ]
        : []),
    ],
  }

  // Fetch a window larger than limit so we can filter claimed URLs in memory.
  const rows = await prisma.report.findMany({
    where: baseWhere,
    orderBy: { id: 'asc' },
    take: Math.max(limit * 20, 50),
    select: {
      id: true,
      url: true,
      sourceUrl: true,
      s3Url: true,
      companyName: true,
      wikidataId: true,
    },
  })

  // Exclude reports that already have a completed (or skipped) run for any URL variant.
  const completedUrls = new Set(
    (
      await prisma.reportRun.findMany({
        where: {
          status: { in: ['completed', 'skipped_no_emissions'] },
          pdfUrl: {
            in: rows.flatMap((r) => reportUrlVariants(r)),
          },
        },
        select: { pdfUrl: true },
      })
    ).map((r) => r.pdfUrl)
  )

  const selected: typeof rows = []
  for (const row of rows) {
    const variants = reportUrlVariants(row)
    if (variants.some((u) => claimed.has(u) || completedUrls.has(u))) {
      continue
    }
    // Prefer rows with a runnable URL
    try {
      reportRunnableUrl(row)
    } catch {
      continue
    }
    selected.push(row)
    if (selected.length >= limit) break
  }

  return selected
}

export async function estimateRemainingCandidates(
  filters: PipelineAutoRunFilters,
  _runOptions: PipelineAutoRunOptions
): Promise<number | null> {
  try {
    // Approximate: count reports with no CompanyReport matching filters.
    // Claimed/completed fine-filter is expensive; UI shows estimate.
    const simplified: Prisma.ReportWhereInput = {
      AND: [
        { companyReports: { none: {} } },
        ...(filters.reportTypeIds.length
          ? [{ reportTypeId: { in: filters.reportTypeIds } }]
          : []),
        ...(filters.registryBatchIds.length
          ? [{ batchId: { in: filters.registryBatchIds } }]
          : []),
        ...(filters.coverageListIds.length
          ? [
              {
                coverageEntryReports: {
                  some: {
                    linkStatus: 'matched' as const,
                    entry: {
                      year: { listId: { in: filters.coverageListIds } },
                    },
                  },
                },
              },
            ]
          : []),
      ],
    }
    return await prisma.report.count({ where: simplified })
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
 * Observe recent auto-run ReportRun outcomes and update failure counters /
 * soft-disable thresholds. Approval waits are ignored.
 */
export async function observeAutoRunOutcomes(): Promise<void> {
  const row = await ensurePipelineAutoRunConfig()
  const since = row.lastTickAt ?? new Date(Date.now() - 10 * 60 * 1000)

  const recentJobs = await prisma.reportRunJob.findMany({
    where: {
      finishedAt: { gte: since },
      reportRun: { autoRun: true },
    },
    select: {
      status: true,
      queueName: true,
      failedReason: true,
      reportRunId: true,
      reportRun: { select: { status: true, threadId: true } },
    },
    orderBy: { finishedAt: 'asc' },
    take: 200,
  })

  let doclingFails = row.consecutiveDoclingFailures
  let reportFails = row.consecutiveReportFailures

  for (const job of recentJobs) {
    if (job.status === 'failed') {
      if (job.queueName === 'doclingParsePDF') {
        doclingFails += 1
      }
      reportFails += 1
    } else if (job.status === 'completed') {
      if (job.queueName === 'doclingParsePDF') {
        doclingFails = 0
      }
      if (job.queueName === 'sendCompanyLink') {
        doclingFails = 0
        reportFails = 0
      }
    }
  }

  // Also reset on completed auto-run ReportRuns
  const completedRuns = await prisma.reportRun.count({
    where: {
      autoRun: true,
      status: { in: ['completed', 'skipped_no_emissions'] },
      updatedAt: { gte: since },
    },
  })
  if (completedRuns > 0) {
    doclingFails = 0
    reportFails = 0
  }

  const data: Prisma.PipelineAutoRunConfigUpdateInput = {
    consecutiveDoclingFailures: doclingFails,
    consecutiveReportFailures: reportFails,
  }

  if (doclingFails >= DOCLING_FAILURE_AUTO_OFF && row.enabled) {
    data.enabled = false
    data.disabledReason = 'docling_failures'
    data.lastError = `Auto-disabled after ${doclingFails} consecutive Docling failures`
  } else if (reportFails >= REPORT_FAILURE_AUTO_OFF && row.enabled) {
    data.enabled = false
    data.disabledReason = 'report_failures'
    data.lastError = `Auto-disabled after ${reportFails} consecutive report failures`
  }

  await prisma.pipelineAutoRunConfig.update({
    where: { id: CONFIG_ID },
    data,
  })
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
    replaceAllEmissions: true,
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
 */
export async function runPipelineAutoRunTick(): Promise<{
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
  const active = await countActivelyProcessingAutoRuns()
  const slots = Math.max(0, latest.maxConcurrent - active)
  if (slots <= 0) {
    return { enqueued: 0, skippedReason: 'at_capacity' }
  }

  const candidates = await selectAutoRunCandidates(filters, runOptions, slots)
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
