import { Queue } from 'bullmq'
import redisConfig from '../config/redis'
import { PIPELINE_AUTO_RUN_QUEUE } from '../queueNames'

export { PIPELINE_AUTO_RUN_QUEUE }
export const PIPELINE_AUTO_RUN_REPEAT_EVERY_MS = 60_000
export const PIPELINE_AUTO_RUN_TICK_SCHEDULER_ID = 'pipeline-auto-run-tick'

/** Fail fast — must not hang PATCH/soft-disable on the BullMQ endless-retry client. */
const SCHEDULE_OP_TIMEOUT_MS = 3_000

// Not withPipelineJobOpts(): that keeps completed jobs forever (pipeline-api
// prunes by run, and ticks belong to no run), so a tick a minute would pile up
// in Redis, which runs with maxmemory + noeviction.
const TICK_JOB_RETENTION = {
  removeOnComplete: { count: 20 },
  removeOnFail: { count: 50 },
}

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

function isCanonicalTickScheduler(scheduler: {
  key?: string | null
  id?: string | null
}): boolean {
  return (
    scheduler.key === PIPELINE_AUTO_RUN_TICK_SCHEDULER_ID ||
    scheduler.id === PIPELINE_AUTO_RUN_TICK_SCHEDULER_ID
  )
}

/** Remove stray tick schedulers; keep the canonical id when `keepCanonical`. */
async function removeTickSchedulers(
  queue: Queue,
  { keepCanonical }: { keepCanonical: boolean }
): Promise<void> {
  for (const scheduler of await queue.getJobSchedulers()) {
    if (scheduler.name !== 'tick') continue
    if (keepCanonical && isCanonicalTickScheduler(scheduler)) continue
    await queue.removeJobScheduler(scheduler.key)
  }
}

async function applyEnabledState(
  queue: Queue,
  enabled: boolean
): Promise<void> {
  if (enabled) {
    // Keep the canonical scheduler so upsert stays idempotent (does not fire an
    // immediate extra tick or reset the every-timer). Clear only stray ticks.
    await removeTickSchedulers(queue, { keepCanonical: true })
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
    await removeTickSchedulers(queue, { keepCanonical: false })
  }
}

/**
 * Align the BullMQ Job Scheduler with the latest DB `enabled` flag.
 * Re-reads `getEnabled` after mutating so a concurrent PATCH / worker boot
 * cannot leave enabled=true with no tick (or the inverse).
 *
 * Does **not** run legacy repeatable purge — that must stay a one-shot boot
 * step. Purging `bull:<queue>:repeat:*` would delete live v6 scheduler keys.
 *
 * On timeout, the queue connection is closed so a late Redis op is less likely
 * to clobber a newer enable/disable.
 */
export async function reconcilePipelineAutoRunSchedule(
  getEnabled: () => Promise<boolean>
): Promise<boolean> {
  const queue = createAutoRunQueue()
  try {
    return await withScheduleTimeout(
      (async () => {
        const enabled = await getEnabled()
        await applyEnabledState(queue, enabled)

        const stillEnabled = await getEnabled()
        if (stillEnabled !== enabled) {
          await applyEnabledState(queue, stillEnabled)
        }
        return stillEnabled
      })(),
      'pipeline-auto-run schedule sync'
    )
  } finally {
    // Do not await close inside the hot PATCH path — reconnect retries can
    // exceed SCHEDULE_OP_TIMEOUT_MS after a timed-out sync.
    void queue.close().catch(() => undefined)
  }
}
