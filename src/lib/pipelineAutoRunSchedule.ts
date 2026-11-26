import { Queue } from 'bullmq'
import redisConfig from '../config/redis'
import { PIPELINE_AUTO_RUN_JOB_RETENTION } from './infraQueueRetention'
import { purgeLegacyBullmqRepeatables } from './purgeLegacyBullmqRepeatables'
import { PIPELINE_AUTO_RUN_QUEUE } from '../queueNames'

export { PIPELINE_AUTO_RUN_QUEUE }
export const PIPELINE_AUTO_RUN_REPEAT_EVERY_MS = 60_000
export const PIPELINE_AUTO_RUN_TICK_SCHEDULER_ID = 'pipeline-auto-run-tick'

/** Fail fast — must not hang PATCH/soft-disable on the BullMQ endless-retry client. */
const SCHEDULE_OP_TIMEOUT_MS = 3_000

const TICK_JOB_RETENTION = PIPELINE_AUTO_RUN_JOB_RETENTION

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
    defaultJobOptions: TICK_JOB_RETENTION,
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

async function removeTickSchedulers(queue: Queue): Promise<void> {
  await purgeLegacyBullmqRepeatables(PIPELINE_AUTO_RUN_QUEUE)
  for (const scheduler of await queue.getJobSchedulers()) {
    if (scheduler.name === 'tick') {
      await queue.removeJobScheduler(scheduler.key)
    }
  }
}

async function applyEnabledState(
  queue: Queue,
  enabled: boolean
): Promise<void> {
  if (enabled) {
    await removeTickSchedulers(queue)
    await queue.upsertJobScheduler(
      PIPELINE_AUTO_RUN_TICK_SCHEDULER_ID,
      { every: PIPELINE_AUTO_RUN_REPEAT_EVERY_MS },
      {
        name: 'tick',
        data: {},
        opts: { ...TICK_JOB_RETENTION },
      }
    )
  } else {
    await removeTickSchedulers(queue)
  }
}

/**
 * Align the BullMQ Job Scheduler with the latest DB `enabled` flag.
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
