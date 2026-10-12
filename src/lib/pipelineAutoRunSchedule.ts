import { Queue } from 'bullmq'
import redis from '../config/redis'
import { withPipelineJobOpts } from './pipelineJobOptions'

export const PIPELINE_AUTO_RUN_QUEUE = 'pipelineAutoRun'
export const PIPELINE_AUTO_RUN_REPEAT_EVERY_MS = 60_000

function createAutoRunQueue(): Queue {
  return new Queue(PIPELINE_AUTO_RUN_QUEUE, {
    connection: redis,
    defaultJobOptions: withPipelineJobOpts({
      removeOnComplete: { count: 20 },
      removeOnFail: { count: 50 },
    }),
  })
}

async function removeTickRepeatables(queue: Queue): Promise<void> {
  const existing = await queue.getRepeatableJobs()
  for (const job of existing) {
    if (job.name === 'tick') {
      await queue.removeRepeatableByKey(job.key)
    }
  }
}

/** Remove the ~60s repeatable tick so disabled auto-run does not hit Redis. */
export async function clearPipelineAutoRunRepeatableTicks(): Promise<void> {
  const queue = createAutoRunQueue()
  try {
    await removeTickRepeatables(queue)
  } finally {
    await queue.close()
  }
}

/** Register a single repeatable tick (clears any prior tick schedules first). */
export async function ensurePipelineAutoRunRepeatableTick(): Promise<void> {
  const queue = createAutoRunQueue()
  try {
    // Replace any prior tick schedules (e.g. older jobId-based keys) so we do
    // not run duplicate overlapping ticks across deploys.
    await removeTickRepeatables(queue)
    // Do not pass a fixed jobId with repeat — BullMQ needs unique ids per
    // delayed repetition. Deduplication is via the repeatable job key.
    await queue.add(
      'tick',
      {},
      {
        repeat: { every: PIPELINE_AUTO_RUN_REPEAT_EVERY_MS },
        ...withPipelineJobOpts(),
      }
    )
  } finally {
    await queue.close()
  }
}

/** Align the BullMQ repeatable schedule with the enabled flag. */
export async function syncPipelineAutoRunSchedule(
  enabled: boolean
): Promise<void> {
  if (enabled) {
    await ensurePipelineAutoRunRepeatableTick()
  } else {
    await clearPipelineAutoRunRepeatableTicks()
  }
}
