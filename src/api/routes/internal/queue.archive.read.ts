import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  getArchivedReportRunByThreadId,
  listArchivedBatches,
  listArchivedReportRuns,
  upsertBatchByName,
} from '../../services/reportRunArchiveReadService'

const queryList = z.object({
  page: z.coerce.number().optional().default(1),
  pageSize: z.coerce.number().optional().default(50),
  q: z.string().optional(),
  /**
   * Comma-separated Garbo `Batch.id` (cuid). Single id = exact match; multiple = OR (`IN`).
   * @deprecated Prefer `batchDbIds`; kept for older clients.
   */
  batchDbId: z.string().optional(),
  /** Same as comma-separated `batchDbIds` (Validate archive multi-select). */
  batchDbIds: z.string().optional(),
  /** Exact match on `Batch.batchName` (pipeline `job.data.batchId`). */
  batchName: z.string().optional(),
})

const queryBatches = z.object({
  limit: z.coerce.number().optional().default(400),
})

const createBatchBodySchema = z.object({
  batchName: z.string().min(1).max(512),
})

/**
 * Postgres-backed BullMQ run archive (Jobbstatus history in Validate).
 * Requires auth; mounted at `api/queue-archive`.
 */
export async function queueArchiveReadRoutes(app: FastifyInstance) {
  app.post(
    '/batches',
    {
      schema: {
        summary:
          'Create or return existing Garbo batch by human-readable name (Validate upload)',
        tags: ['Internal'],
        body: createBatchBodySchema,
        hide: true,
      },
    },
    async (request, reply) => {
      const { batchName } = request.body as z.infer<
        typeof createBatchBodySchema
      >
      try {
        const batch = await upsertBatchByName(batchName)
        return reply.send({ batch })
      } catch (err) {
        request.log.error({ err }, 'queue-archive POST /batches failed')
        return reply.status(400).send({
          error: err instanceof Error ? err.message : 'Invalid batch',
        })
      }
    }
  )

  app.get(
    '/batches',
    {
      schema: {
        summary:
          'List batches (stable id + batch name / pipeline batch id string)',
        tags: ['Internal'],
        querystring: queryBatches,
        hide: true,
      },
    },
    async (request, reply) => {
      const q = queryBatches.parse(request.query)
      const data = await listArchivedBatches(q.limit)
      return reply.send(data)
    }
  )

  app.get(
    '/runs',
    {
      schema: {
        summary: 'List archived report runs (Postgres)',
        tags: ['Internal'],
        querystring: queryList,
        hide: true,
      },
    },
    async (request, reply) => {
      const q = queryList.parse(request.query)
      const merged = new Set<string>()
      for (const part of (q.batchDbIds ?? '').split(',')) {
        const t = part.trim()
        if (t) merged.add(t)
      }
      const single = q.batchDbId?.trim()
      if (single) merged.add(single)
      const batchDbIds = [...merged]
      const data = await listArchivedReportRuns({
        page: q.page,
        pageSize: q.pageSize,
        q: q.q,
        batchDbIds: batchDbIds.length > 0 ? batchDbIds : undefined,
        batchName: q.batchName,
      })
      return reply.send(data)
    }
  )

  app.get(
    '/runs/:threadId',
    {
      schema: {
        summary: 'Get one archived report run with jobs',
        tags: ['Internal'],
        params: z.object({ threadId: z.string().min(1) }),
        hide: true,
      },
    },
    async (request, reply) => {
      const { threadId } = request.params as { threadId: string }
      const run = await getArchivedReportRunByThreadId(threadId)
      if (!run) {
        return reply.status(404).send({ error: 'Run not found' })
      }
      return reply.send(run)
    }
  )
}
