import { Worker } from 'bullmq'
import redis from '../config/redis'
import {
  ensurePipelineAutoRunConfig,
  runPipelineAutoRunTick,
} from '../api/services/pipelineAutoRunService'
import {
  PIPELINE_AUTO_RUN_QUEUE,
  PIPELINE_AUTO_RUN_REPEAT_EVERY_MS,
  syncPipelineAutoRunSchedule,
} from '../lib/pipelineAutoRunSchedule'

export { PIPELINE_AUTO_RUN_QUEUE }

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

async function syncScheduleFromConfig() {
  try {
    const row = await ensurePipelineAutoRunConfig()
    await syncPipelineAutoRunSchedule(row.enabled)
    console.log(
      row.enabled
        ? `[pipelineAutoRun] repeatable tick every ${PIPELINE_AUTO_RUN_REPEAT_EVERY_MS}ms registered`
        : '[pipelineAutoRun] auto-run disabled — repeatable tick not scheduled'
    )
  } catch (err) {
    console.error('[pipelineAutoRun] failed to sync repeatable tick:', err)
  }
}

void syncScheduleFromConfig()

export default worker
