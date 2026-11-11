import { DelayedError, type Job } from 'bullmq'

/**
 * Park the job until `until` and stop the processor the BullMQ way.
 * Callers must not `return` after this — it always throws `DelayedError`.
 */
export async function delayJob(job: Job, until: number): Promise<never> {
  await job.moveToDelayed(until, job.token)
  throw new DelayedError()
}
