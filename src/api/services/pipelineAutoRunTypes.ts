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
  /** Garbo Batch.id or batchName string for Jobbstatus filtering. Null clears. */
  batchId: z.string().min(1).nullable().optional(),
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

export function reportUrlVariants(report: {
  url: string
  sourceUrl: string | null
  s3Url: string | null
}): string[] {
  return [report.url, report.sourceUrl, report.s3Url]
    .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    .map((u) => u.trim())
}

export type AutoRunCandidateReportRow = {
  id: string
  url: string
  sourceUrl: string | null
  s3Url: string | null
  companyName: string | null
  wikidataId: string | null
}

/** Pure page filter for candidate selection (unit-tested). */
export function pickCandidatesFromPage(
  rows: AutoRunCandidateReportRow[],
  claimedUrls: Set<string>,
  limit: number
): AutoRunCandidateReportRow[] {
  const selected: AutoRunCandidateReportRow[] = []
  for (const row of rows) {
    if (selected.length >= limit) break
    const variants = reportUrlVariants(row)
    if (variants.length === 0) continue
    if (variants.some((u) => claimedUrls.has(u))) continue
    const runnable = reportRunnableUrl(row)
    if (!runnable.url?.trim()) continue
    selected.push(row)
  }
  return selected
}

/**
 * Queues whose waiting/active/paused (and non-approval delayed) auto-run jobs
 * occupy a concurrency slot. Includes mid-pipeline LLM/API work — not only
 * Docling-early queues — so maxConcurrent bounds overnight drain cost.
 * Jobs delayed waiting for staff approval are excluded in the counter.
 */
export const AUTO_RUN_SLOT_QUEUES = [
  'parsePdf',
  'doclingParsePDF',
  'indexMarkdown',
  'checkEmissionsPresence',
  'precheck',
  'guessWikidata',
  'extractEmissions',
  'extractDescriptions',
  'extractLEI',
  'followUpScope1',
  'followUpScope2',
  'followUpScope12',
  'followUpScope3',
  'followUpBiogenic',
  'followUpEconomy',
  'followUpGoals',
  'followUpInitiatives',
  'followUpFiscalYear',
  'followUpCompanyTags',
  'followUpReportType',
  'followUpBaseYear',
  'followUpIndustryGics',
  'followUpReportingQuality',
  'checkDB',
  'diffBaseYear',
  'diffGoals',
  'diffIndustry',
  'diffInitiatives',
  'diffReportingPeriods',
  'diffTags',
  'diffReportType',
  'diffDescriptions',
  'diffLEI',
  'diffReportingQuality',
  'saveToAPI',
  'sendCompanyLink',
] as const

/** Queues where a delayed job may be waiting for staff approval (slot freed). */
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
