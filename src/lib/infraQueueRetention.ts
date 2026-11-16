import type { DefaultJobOptions, KeepJobs, Queue } from 'bullmq'

/** Completed auto-run ticks kept in Redis (one tick/minute). */
export const PIPELINE_AUTO_RUN_KEEP_COMPLETED = 20
/** Failed auto-run ticks kept for debugging. */
export const PIPELINE_AUTO_RUN_KEEP_FAILED = 50

/** Completed chroma sweeps kept (hourly). */
export const CHROMA_SWEEP_KEEP_COMPLETED = 24
export const CHROMA_SWEEP_KEEP_FAILED = 50

export const PIPELINE_AUTO_RUN_REMOVE_ON_COMPLETE: KeepJobs = {
  count: PIPELINE_AUTO_RUN_KEEP_COMPLETED,
}
export const PIPELINE_AUTO_RUN_REMOVE_ON_FAIL: KeepJobs = {
  count: PIPELINE_AUTO_RUN_KEEP_FAILED,
}

export const CHROMA_SWEEP_REMOVE_ON_COMPLETE: KeepJobs = {
  count: CHROMA_SWEEP_KEEP_COMPLETED,
}
export const CHROMA_SWEEP_REMOVE_ON_FAIL: KeepJobs = {
  count: CHROMA_SWEEP_KEEP_FAILED,
}

export const PIPELINE_AUTO_RUN_JOB_RETENTION: DefaultJobOptions = {
  removeOnComplete: PIPELINE_AUTO_RUN_REMOVE_ON_COMPLETE,
  removeOnFail: PIPELINE_AUTO_RUN_REMOVE_ON_FAIL,
}

export const CHROMA_SWEEP_JOB_RETENTION: DefaultJobOptions = {
  removeOnComplete: CHROMA_SWEEP_REMOVE_ON_COMPLETE,
  removeOnFail: CHROMA_SWEEP_REMOVE_ON_FAIL,
}

/**
 * Force-trim a finished set down to `keep` newest jobs.
 *
 * BullMQ's removeOnComplete only runs when a job finishes. After a Redis /
 * client bump, or when older jobs were stored with removeOnComplete:false,
 * call this so already-piled jobs are cleared immediately.
 */
export async function trimQueueJobSet(
  queue: Queue,
  status: 'completed' | 'failed',
  keep: number
): Promise<number> {
  if (!Number.isInteger(keep) || keep < 0) {
    throw new Error(`keep must be an integer >= 0, got ${keep}`)
  }

  const counts = await queue.getJobCounts(status)
  const total = counts[status] ?? 0
  const excess = total - keep
  if (excess <= 0) return 0

  // asc:true → oldest first for scored sets (completed/failed).
  const oldest = await queue.getJobs([status], 0, excess - 1, true)
  let removed = 0
  for (const job of oldest) {
    try {
      await job.remove()
      removed += 1
    } catch {
      // Locked jobs are skipped; a later trim/completion will retry.
    }
  }
  return removed
}

export async function trimInfraQueueRetention(
  queue: Queue,
  retention: {
    keepCompleted: number
    keepFailed: number
  }
): Promise<{ completedRemoved: number; failedRemoved: number }> {
  const completedRemoved = await trimQueueJobSet(
    queue,
    'completed',
    retention.keepCompleted
  )
  const failedRemoved = await trimQueueJobSet(
    queue,
    'failed',
    retention.keepFailed
  )
  return { completedRemoved, failedRemoved }
}
