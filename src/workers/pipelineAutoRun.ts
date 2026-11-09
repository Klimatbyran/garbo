import { Worker } from 'bullmq'
import redis from '../config/redis'
import { runPipelineAutoRunTick } from '../api/services/pipelineAutoRunService'
import { getSharedQueue } from '../lib/getSharedQueue'
import { PIPELINE_AUTO_RUN_QUEUE } from '../queueNames'

export { PIPELINE_AUTO_RUN_QUEUE }
const REPEAT_EVERY_MS = 60_000

// Not withPipelineJobOpts(): that keeps completed jobs forever (pipeline-api
// prunes by run, and ticks belong to no run), so a tick a minute would pile up
// in Redis, which runs with maxmemory + noeviction.
const TICK_JOB_RETENTION = {
  removeOnComplete: { count: 20 },
  removeOnFail: { count: 50 },
}

const queue = getSharedQueue(PIPELINE_AUTO_RUN_QUEUE, TICK_JOB_RETENTION)

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

const TICK_SCHEDULER_ID = 'pipeline-auto-run-tick'

async function ensureRepeatableTick() {
  try {
    // BullMQ 6: Job Schedulers replace legacy repeatable jobs. Clear prior
    // schedulers so redeploys do not stack duplicate ticks. Pre-v6
    // `bull:<queue>:repeat:*` keys (if any) should be deleted once in Redis
    // after the first deploy of this change.
    for (const scheduler of await queue.getJobSchedulers()) {
      if (scheduler.name === 'tick') {
        await queue.removeJobScheduler(scheduler.key)
      }
    }

    await queue.upsertJobScheduler(
      TICK_SCHEDULER_ID,
      { every: REPEAT_EVERY_MS },
      {
        name: 'tick',
        data: {},
        opts: { ...TICK_JOB_RETENTION },
      }
    )
    console.log(
      `[pipelineAutoRun] job scheduler tick every ${REPEAT_EVERY_MS}ms registered`
    )
  } catch (err) {
    console.error('[pipelineAutoRun] failed to register repeatable tick:', err)
  }
}

void ensureRepeatableTick()

export default worker
