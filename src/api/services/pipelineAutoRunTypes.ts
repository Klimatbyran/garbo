import { z } from 'zod'

export const DOCLING_FAILURE_AUTO_OFF = 3
export const REPORT_FAILURE_AUTO_OFF = 5

export const pipelineAutoRunFiltersSchema = z.object({
  reportTypeIds: z.array(z.string().min(1)).optional().default([]),
  registryBatchIds: z.array(z.string().min(1)).optional().default([]),
  coverageListIds: z.array(z.string().min(1)).optional().default([]),
})

export const pipelineAutoRunOptionsSchema = z.object({
  autoApprove: z.boolean().optional().default(true),
  forceReindex: z.boolean().optional().default(false),
  requireEmissionsPresence: z.boolean().optional().default(true),
  runOnly: z.array(z.string().min(1)).optional(),
  tags: z.array(z.string().min(1)).optional(),
  /** Garbo Batch.id or batchName string for Jobbstatus filtering. */
  batchId: z.string().min(1).optional(),
})

export const pipelineAutoRunPatchSchema = z.object({
  enabled: z.boolean().optional(),
  maxConcurrent: z.number().int().min(1).max(10).optional(),
  filters: pipelineAutoRunFiltersSchema.partial().optional(),
  runOptions: pipelineAutoRunOptionsSchema.partial().optional(),
  /** When re-enabling, clear failure counters (default true if enabling). */
  resetFailureCounters: z.boolean().optional(),
})

export type PipelineAutoRunFilters = z.infer<
  typeof pipelineAutoRunFiltersSchema
>
export type PipelineAutoRunOptions = z.infer<
  typeof pipelineAutoRunOptionsSchema
>
export type PipelineAutoRunPatch = z.infer<typeof pipelineAutoRunPatchSchema>

export type PipelineAutoRunStatus = {
  enabled: boolean
  maxConcurrent: number
  filters: PipelineAutoRunFilters
  runOptions: PipelineAutoRunOptions
  consecutiveDoclingFailures: number
  consecutiveReportFailures: number
  pausedReason: string | null
  disabledReason: string | null
  lastTickAt: string | null
  lastEnqueuedAt: string | null
  lastError: string | null
  updatedBy: string | null
  updatedAt: string
  activelyProcessing: number
  parkedOnApproval: number
  remainingEstimate: number | null
  doclingReachable: boolean | null
}

/** Prefer cached PDF URL for workers; keep web sourceUrl when available. */
export function reportRunnableUrl(report: {
  url: string
  sourceUrl: string | null
  s3Url: string | null
}): { url: string; sourceUrl?: string } {
  if (report.s3Url?.trim()) {
    return {
      url: report.s3Url.trim(),
      sourceUrl:
        report.sourceUrl?.trim() ||
        (report.url.startsWith('http') ? report.url : undefined),
    }
  }
  const source = report.sourceUrl?.trim()
  if (source) return { url: source }
  return { url: report.url }
}

/** Early queues that occupy an auto-run concurrency slot. */
export const AUTO_RUN_ACTIVE_QUEUES = [
  'parsePdf',
  'doclingParsePDF',
  'indexMarkdown',
  'checkEmissionsPresence',
] as const

/** Queues where a delayed job may be waiting for staff approval. */
export const AUTO_RUN_APPROVAL_QUEUES = [
  'precheck',
  'guessWikidata',
  'saveToAPI',
  'diffReportingPeriods',
  'diffIndustry',
  'diffGoals',
  'diffInitiatives',
  'diffBaseYear',
  'diffTags',
  'diffReportType',
  'diffDescriptions',
  'diffReportingQuality',
  'diffLEI',
] as const
