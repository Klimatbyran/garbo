import { Worker } from 'bullmq'
import redis from '../config/redis'
import {
  ensurePipelineAutoRunConfig,
  runPipelineAutoRunTick,
} from '../api/services/pipelineAutoRunService'
import {
  PIPELINE_AUTO_RUN_QUEUE,
  PIPELINE_AUTO_RUN_REPEAT_EVERY_MS,
  reconcilePipelineAutoRunSchedule,
} from '../lib/pipelineAutoRunSchedule'

/** Heal schedule drift (enabled with no tick, or disabled with a leftover tick). */
const RECONCILE_EVERY_MS = 5 * 60 * 1000

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
  }
)

worker.on('failed', (job, err) => {
  console.error(
    `[pipelineAutoRun] tick failed job=${job?.id}:`,
    err?.message ?? err
  )
})

async function readAutoRunEnabled(): Promise<boolean> {
  const row = await ensurePipelineAutoRunConfig()
  return row.enabled
}

async function syncScheduleFromConfig() {
  try {
    const enabled = await readAutoRunEnabled()
    await reconcilePipelineAutoRunSchedule(readAutoRunEnabled)
    console.log(
      enabled
        ? `[pipelineAutoRun] repeatable tick every ${PIPELINE_AUTO_RUN_REPEAT_EVERY_MS}ms registered`
        : '[pipelineAutoRun] auto-run disabled — repeatable tick not scheduled'
    )
  } catch (err) {
    console.error('[pipelineAutoRun] failed to sync repeatable tick:', err)
  }
}

void syncScheduleFromConfig()
setInterval(() => {
  void syncScheduleFromConfig()
}, RECONCILE_EVERY_MS).unref?.()

export default worker
