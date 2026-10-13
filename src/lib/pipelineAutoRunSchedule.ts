import { Queue } from 'bullmq'
import redisConfig from '../config/redis'
import { withPipelineJobOpts } from './pipelineJobOptions'

export const PIPELINE_AUTO_RUN_QUEUE = 'pipelineAutoRun'
export const PIPELINE_AUTO_RUN_REPEAT_EVERY_MS = 60_000

/** Fail fast — must not hang PATCH/soft-disable on the BullMQ endless-retry client. */
const SCHEDULE_OP_TIMEOUT_MS = 3_000

function createAutoRunQueue(): Queue {
  return new Queue(PIPELINE_AUTO_RUN_QUEUE, {
    connection: {
      host: redisConfig.host,
      port: redisConfig.port,
      ...(redisConfig.password ? { password: redisConfig.password } : {}),
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 2_000,
      retryStrategy(times: number) {
        if (times > 3) return null
        return 200
      },
    },
    defaultJobOptions: withPipelineJobOpts({
      removeOnComplete: { count: 20 },
      removeOnFail: { count: 50 },
    }),
  })
}

async function withScheduleTimeout<T>(
  work: Promise<T>,
  label: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      work,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(`${label} timed out after ${SCHEDULE_OP_TIMEOUT_MS}ms`)
            ),
          SCHEDULE_OP_TIMEOUT_MS
        )
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

async function removeTickRepeatables(queue: Queue): Promise<void> {
  const existing = await queue.getRepeatableJobs()
  for (const job of existing) {
    if (job.name === 'tick') {
      await queue.removeRepeatableByKey(job.key)
    }
  }
}

async function applyEnabledState(
  queue: Queue,
  enabled: boolean
): Promise<void> {
  if (enabled) {
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
  } else {
    await removeTickRepeatables(queue)
  }
}

/**
 * Align the BullMQ repeatable schedule with the latest DB `enabled` flag.
 * Re-reads `getEnabled` after mutating so a concurrent PATCH / worker boot
 * cannot leave enabled=true with no tick (or the inverse).
 *
 * On timeout, the queue connection is closed so a late Redis op is less likely
 * to clobber a newer enable/disable.
 */
export async function reconcilePipelineAutoRunSchedule(
  getEnabled: () => Promise<boolean>
): Promise<void> {
  const queue = createAutoRunQueue()
  try {
    await withScheduleTimeout(
      (async () => {
        const enabled = await getEnabled()
        await applyEnabledState(queue, enabled)

        const stillEnabled = await getEnabled()
        if (stillEnabled !== enabled) {
          await applyEnabledState(queue, stillEnabled)
        }
      })(),
      'pipeline-auto-run schedule sync'
    )
  } finally {
    await queue.close().catch(() => undefined)
  }
}
