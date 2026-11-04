import { JobsOptions } from 'bullmq'
import { withPipelineJobOpts } from './pipelineJobOptions'

type EnqueueTarget = {
  add: (
    name: string,
    data: Record<string, unknown>,
    opts?: JobsOptions
  ) => Promise<unknown>
}

/**
 * Enqueue a follow-up job without a BullMQ parent link.
 *
 * ParentOptions.queue must be the qualified name (`job.queueQualifiedName`,
 * e.g. `bull:extractGleifIds`). Using `job.queueName` always fails with
 * "Missing key for parent job". Real parenting also needs
 * `moveToWaitingChildren` + `WaitingChildrenError` and an idempotent re-entry
 * path in the processor — see extractGleifIdsProcess. Diff → saveToAPI stays
 * unparented until that pattern is shared.
 */
export async function enqueueFollowUp(
  queue: EnqueueTarget,
  name: string,
  data: Record<string, unknown>,
  jobOptions: JobsOptions = {}
): Promise<void> {
  await queue.add(name, data, withPipelineJobOpts(jobOptions))
}
