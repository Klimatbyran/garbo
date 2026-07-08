import type { JobsOptions } from 'bullmq'

/** Align with pipeline-api run retention (secondary safety net per queue). */
export const DEFAULT_PIPELINE_JOB_OPTIONS: JobsOptions = {
  removeOnComplete: {
    count: 15,
  },
  removeOnFail: {
    age: 1_209_600,
  },
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
