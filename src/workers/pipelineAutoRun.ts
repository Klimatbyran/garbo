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
    lockDuration: 2 * 60 * 1000,
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
    await queue.add(
      'tick',
      {},
      {
        repeat: { every: REPEAT_EVERY_MS },
        jobId: 'pipeline-auto-run-tick',
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
