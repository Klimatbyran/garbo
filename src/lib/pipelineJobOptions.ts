import type { JobsOptions } from 'bullmq'

/**
 * Completed jobs are evicted by run-level pruning in pipeline-api (15 most recent
 * runs), not per-queue caps. Per-queue removeOnComplete caused saveToAPI jobs to
 * disappear from live Jobbstatus while their run was still within the keep window.
 */
export const DEFAULT_PIPELINE_JOB_OPTIONS: JobsOptions = {
  removeOnComplete: false,
  removeOnFail: {
    age: 1_209_600,
  },
}

/** Multiple saveToAPI jobs per run — never use per-queue eviction here. */
export const SAVE_TO_API_JOB_OPTIONS: JobsOptions = {
  removeOnComplete: false,
}

export function withPipelineJobOpts(opts?: JobsOptions): JobsOptions {
  const merged: JobsOptions = {
    ...DEFAULT_PIPELINE_JOB_OPTIONS,
    ...opts,
  }

  if (
    typeof DEFAULT_PIPELINE_JOB_OPTIONS.removeOnComplete === 'object' &&
    typeof opts?.removeOnComplete === 'object'
  ) {
    merged.removeOnComplete = {
      ...DEFAULT_PIPELINE_JOB_OPTIONS.removeOnComplete,
      ...opts.removeOnComplete,
    }
  }

  if (
    typeof DEFAULT_PIPELINE_JOB_OPTIONS.removeOnFail === 'object' &&
    typeof opts?.removeOnFail === 'object'
  ) {
    merged.removeOnFail = {
      ...DEFAULT_PIPELINE_JOB_OPTIONS.removeOnFail,
      ...opts.removeOnFail,
    }
  }

  return merged
}
