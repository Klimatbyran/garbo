import { Worker } from 'bullmq'
import redis from '../config/redis'
import {
  ensurePipelineAutoRunConfig,
  runPipelineAutoRunTick,
} from '../api/services/pipelineAutoRunService'
import { getSharedQueue } from '../lib/getSharedQueue'
import {
  PIPELINE_AUTO_RUN_JOB_RETENTION,
  PIPELINE_AUTO_RUN_KEEP_COMPLETED,
  PIPELINE_AUTO_RUN_KEEP_FAILED,
  PIPELINE_AUTO_RUN_REMOVE_ON_COMPLETE,
  PIPELINE_AUTO_RUN_REMOVE_ON_FAIL,
  trimInfraQueueRetention,
} from '../lib/infraQueueRetention'
import {
  PIPELINE_AUTO_RUN_QUEUE,
  PIPELINE_AUTO_RUN_REPEAT_EVERY_MS,
  reconcilePipelineAutoRunSchedule,
} from '../lib/pipelineAutoRunSchedule'
import { purgeLegacyBullmqRepeatables } from '../lib/purgeLegacyBullmqRepeatables'

export { PIPELINE_AUTO_RUN_QUEUE }

/** Heal schedule drift (enabled with no tick, or disabled with a leftover tick). */
const RECONCILE_EVERY_MS = 5 * 60 * 1000

const queue = getSharedQueue(
  PIPELINE_AUTO_RUN_QUEUE,
  PIPELINE_AUTO_RUN_JOB_RETENTION
)

const worker = new Worker(
  PIPELINE_AUTO_RUN_QUEUE,
  async (job) => {
    job.log('pipelineAutoRun tick starting')
    const result = await runPipelineAutoRunTick()
    job.log(
      `pipelineAutoRun tick done enqueued=${result.enqueued}` +
        (result.skippedReason ? ` skipped=${result.skippedReason}` : '')
    )
    return result
  },
  {
    connection: redis,
    concurrency: 1,
    // Must exceed TICK_LOCK_TIMEOUT_MS so a timed-out tick can finish cleanup
    // before BullMQ stalls the job; still short enough to recover if the
    // process wedges without rejecting.
    lockDuration: 2 * 60 * 1000,
    stalledInterval: 30_000,
    maxStalledCount: 1,
    // Worker-level fallback when job opts omit removeOnComplete. Jobs that
    // explicitly store removeOnComplete:false still need the startup/cron trim.
    removeOnComplete: PIPELINE_AUTO_RUN_REMOVE_ON_COMPLETE,
    removeOnFail: PIPELINE_AUTO_RUN_REMOVE_ON_FAIL,
  }
)

worker.on('failed', (job, err) => {
  console.error(
    `[pipelineAutoRun] tick failed job=${job?.id}:`,
    err?.message ?? err
  )
})

worker.on('error', (err) => {
  console.error('[pipelineAutoRun] worker error:', err?.message ?? err)
})

async function trimExcessTicks() {
  try {
    const trimmed = await trimInfraQueueRetention(queue, {
      keepCompleted: PIPELINE_AUTO_RUN_KEEP_COMPLETED,
      keepFailed: PIPELINE_AUTO_RUN_KEEP_FAILED,
    })
    if (trimmed.completedRemoved > 0 || trimmed.failedRemoved > 0) {
      console.log(
        `[pipelineAutoRun] trimmed excess ticks completed=${trimmed.completedRemoved} failed=${trimmed.failedRemoved}`
      )
    }
  } catch (err) {
    console.error('[pipelineAutoRun] failed to trim excess ticks:', err)
  }
}

async function readAutoRunEnabled(): Promise<boolean> {
  const row = await ensurePipelineAutoRunConfig()
  return row.enabled
}

async function syncScheduleFromConfig() {
  // Trim independently of scheduler registration — getJobSchedulers can throw
  // on leftover legacy members; retention still needs to run.
  await trimExcessTicks()

  try {
    const enabled = await reconcilePipelineAutoRunSchedule(readAutoRunEnabled)
    console.log(
      enabled
        ? `[pipelineAutoRun] job scheduler tick every ${PIPELINE_AUTO_RUN_REPEAT_EVERY_MS}ms registered`
        : '[pipelineAutoRun] auto-run disabled — job scheduler tick not scheduled'
    )
  } catch (err) {
    console.error('[pipelineAutoRun] failed to sync job scheduler tick:', err)
  }
}

async function bootSchedule() {
  try {
    // One-shot: strip pre-v6 repeatable members that break getJobSchedulers.
    // Must NOT run on every reconcile — v6 scheduler keys share the same prefix.
    const purged = await purgeLegacyBullmqRepeatables(PIPELINE_AUTO_RUN_QUEUE)
    if (purged > 0) {
      console.log(
        `[pipelineAutoRun] purged ${purged} legacy BullMQ v5 repeatable key(s)`
      )
    }
  } catch (err) {
    console.error('[pipelineAutoRun] failed to purge legacy repeatables:', err)
  }
  await syncScheduleFromConfig()
}

void bootSchedule()
setInterval(() => {
  void syncScheduleFromConfig()
}, RECONCILE_EVERY_MS).unref?.()

export default worker
