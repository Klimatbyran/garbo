import { PipelineJob, PipelineWorker } from './PipelineWorker'
import { Job, JobsOptions, WorkerOptions } from 'bullmq'
import redis from '../config/redis'
import saveToAPI from '../workers/saveToAPI'
import { canonicalPublicReportUrl, defaultMetadata } from './saveUtils'
import {
  SAVE_TO_API_JOB_OPTIONS,
  withPipelineJobOpts,
} from './pipelineJobOptions'

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
 * path in the processor — see extractGleifIds. Diff → saveToAPI stays
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

/**
 * Enqueue saveToAPI without parenting the current job. Kept name for call
 * sites; parenting is intentionally skipped (see enqueueFollowUp).
 */
export async function enqueueSaveToAPIWithParentFallback(
  _job: Job,
  name: string,
  data: Record<string, unknown>
): Promise<void> {
  await enqueueFollowUp(
    saveToAPI.queue,
    name,
    data,
    SAVE_TO_API_JOB_OPTIONS
  )
}

export interface ChangeDescription {
  type: string
  oldValue?
  newValue
}

type JobWithApproval = {
  data: {
    approval?: { type?: string; approved?: boolean }
  }
}

/** Staff approved this diff worker's own payload (not e.g. companyLink). */
export function isApprovedForDiffType(
  job: JobWithApproval,
  apiSubEndpoint: string
): boolean {
  const approval = job.data.approval
  return approval?.approved === true && approval?.type === apiSubEndpoint
}

/** This diff worker is waiting on its own approval gate. */
export function isPendingApprovalForDiffType(
  job: JobWithApproval,
  apiSubEndpoint: string
): boolean {
  const approval = job.data.approval
  return !!approval && approval.type === apiSubEndpoint && !approval.approved
}

/**
 * Run diff computation when there is no pending approval for this endpoint.
 * Ignores unrelated approvals already on the job (companyLink, wikidata, …).
 */
export function shouldRunDiffComputation(
  job: JobWithApproval,
  apiSubEndpoint: string
): boolean {
  if (isApprovedForDiffType(job, apiSubEndpoint)) return false
  return !isPendingApprovalForDiffType(job, apiSubEndpoint)
}

export class DiffJob extends PipelineJob {
  declare data: PipelineJob['data'] & {
    companyName: string
    companyId: string
    wikidata?: { node: string }
  }

  enqueueSaveToAPI: (
    apiSubEndpoint: string,
    companyName: string,
    body: Record<string, unknown>
  ) => Promise<void>

  handleDiff: (
    apiSubEndpoint: string,
    diff: string,
    change: ChangeDescription,
    requiresApproval: boolean,
    options?: {
      forceSave?: boolean
      saveBodyExtras?: Record<string, unknown>
    }
  ) => Promise<void>
}

function addCustomMethods(job: DiffJob) {
  job.enqueueSaveToAPI = async (apiSubEndpoint, companyName, body) => {
    const name = companyName + ' ' + apiSubEndpoint
    const data = {
      ...job.data,
      companyName,
      body,
      apiSubEndpoint,
    }

    await enqueueSaveToAPIWithParentFallback(job, name, data)
  }

  job.handleDiff = async (
    apiSubEndpoint,
    diff,
    change,
    requiresApproval,
    options
  ) => {
    if (diff && requiresApproval && !job.data.autoApprove) {
      job.log('The data needs approval before saving to API.')

      await job.sendMessage({
        content: `## ${apiSubEndpoint}\n\nNew changes for ${job.data.companyName}\n\n${diff}`,
      })
      await job.requestApproval(
        apiSubEndpoint,
        change,
        false,
        defaultMetadata(
          canonicalPublicReportUrl(
            job.data as { url: string; sourceUrl?: string }
          )
        ),
        `Updates to the company's ${apiSubEndpoint}`
      )
    } else if (diff || options?.forceSave) {
      if (options?.forceSave && !diff) {
        job.log(
          'Forcing save to API: new report PDF identity is not in the database yet.'
        )
      }
      await job.enqueueSaveToAPI(apiSubEndpoint, job.data.companyName, {
        ...change.newValue,
        ...options?.saveBodyExtras,
        metadata: defaultMetadata(
          canonicalPublicReportUrl(
            job.data as { url: string; sourceUrl?: string }
          )
        ),
      })
    }
  }

  return job
}

export class DiffWorker<T extends DiffJob> extends PipelineWorker<DiffJob> {
  constructor(
    name: string,
    callback: (job: T) => unknown,
    options?: WorkerOptions
  ) {
    super(name, (job: T) => callback(addCustomMethods(job) as T), {
      concurrency: 3,
      ...options,
      connection: redis,
    })
  }
}
