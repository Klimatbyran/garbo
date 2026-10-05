import { Worker, Queue } from 'bullmq'
import redis from '../config/redis'
import { runPipelineAutoRunTick } from '../api/services/pipelineAutoRunService'
import { withPipelineJobOpts } from '../lib/pipelineJobOptions'

export const PIPELINE_AUTO_RUN_QUEUE = 'pipelineAutoRun'
const REPEAT_EVERY_MS = 60_000

const queue = new Queue(PIPELINE_AUTO_RUN_QUEUE, {
  connection: redis,
  defaultJobOptions: withPipelineJobOpts({
    removeOnComplete: { count: 20 },
    removeOnFail: { count: 50 },
  }),
})

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

async function ensureRepeatableTick() {
  try {
    // Replace any prior tick schedules (e.g. older jobId-based keys) so we do
    // not run duplicate overlapping ticks across deploys.
    const existing = await queue.getRepeatableJobs()
    for (const job of existing) {
      if (job.name === 'tick') {
        await queue.removeRepeatableByKey(job.key)
      }
    }
    // Do not pass a fixed jobId with repeat — BullMQ needs unique ids per
    // delayed repetition. Deduplication is via the repeatable job key.
    await queue.add(
      'tick',
      {},
      {
        repeat: { every: REPEAT_EVERY_MS },
        ...withPipelineJobOpts(),
      }
    )
    console.log(
      `[pipelineAutoRun] repeatable tick every ${REPEAT_EVERY_MS}ms registered`
    )
  } catch (err) {
    console.error('[pipelineAutoRun] failed to register repeatable tick:', err)
  }
}

void ensureRepeatableTick()

export default worker
