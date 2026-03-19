import type { Job } from 'bullmq'

import { prisma } from './prisma'

const DEFAULT_MAX_STRING_CHARS = 50_000

function truncateString(value: string, maxChars: number) {
  if (value.length <= maxChars) return value
  return value.slice(0, maxChars) + `…[truncated ${value.length - maxChars} chars]`
}

function pruneForArchive(value: any, maxStringChars = DEFAULT_MAX_STRING_CHARS) {
  const dropKeys = new Set([
    // common big payloads
    'markdown',
    'documents',
    'embeddings',
    // discord.js objects can get huge / circular
    'client',
    'message',
  ])

  const seen = new WeakSet<object>()

  const walk = (v: any): any => {
    if (v === null || v === undefined) return v
    if (typeof v === 'string') return truncateString(v, maxStringChars)
    if (typeof v === 'number' || typeof v === 'boolean') return v
    if (Array.isArray(v)) return v.map(walk)

    if (typeof v === 'object') {
      if (seen.has(v)) return '[circular]'
      seen.add(v)
      const out: Record<string, any> = {}
      for (const [k, child] of Object.entries(v)) {
        if (dropKeys.has(k)) continue
        out[k] = walk(child)
      }
      return out
    }

    return String(v)
  }

  return walk(value)
}

export async function archiveJobRun(params: {
  queueName: string
  status: 'completed' | 'failed'
  job: Job
  result?: unknown
  error?: unknown
}) {
  const { queueName, status, job } = params

  const finishedAt = new Date()
  const startedAt = job.timestamp ? new Date(job.timestamp) : finishedAt
  const durationMs =
    typeof job.processedOn === 'number'
      ? finishedAt.getTime() - job.processedOn
      : finishedAt.getTime() - startedAt.getTime()

  const dataAny = (job.data ?? {}) as any

  const errorString =
    params.error instanceof Error
      ? `${params.error.name}: ${params.error.message}\n${params.error.stack ?? ''}`
      : params.error
        ? String(params.error)
        : undefined

  // batchId is the primary run label for comparing prompt changes (propagated via job.data).
  // NOTE: Cast to avoid TypeScript linter lag after Prisma schema changes.
  // The runtime Prisma client should include the model once codegen runs.
  const client = prisma as any

  return client.jobRunArchive.create({
    data: {
      queueName,
      jobName: job.name,
      bullJobId: String(job.id ?? ''),
      parentBullJobId: job.parent?.id ? String(job.parent.id) : undefined,
      url: typeof dataAny.url === 'string' ? dataAny.url : undefined,
      batchId: typeof dataAny.batchId === 'string' ? dataAny.batchId : undefined,
      runLabel:
        typeof dataAny.runLabel === 'string' ? dataAny.runLabel : undefined,
      promptVersion:
        typeof dataAny.promptVersion === 'string'
          ? dataAny.promptVersion
          : undefined,
      status,
      startedAt,
      finishedAt,
      durationMs: Number.isFinite(durationMs) ? Math.max(0, durationMs) : null,
      inputData: pruneForArchive(job.data),
      outputData:
        params.result === undefined ? undefined : pruneForArchive(params.result),
      error: errorString,
    },
  })
}

