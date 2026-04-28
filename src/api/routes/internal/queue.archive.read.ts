import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  getArchivedReportRunByThreadId,
  listArchivedReportRunBatchIds,
  listArchivedReportRuns,
} from '../../services/reportRunArchiveReadService'

const queryList = z.object({
  page: z.coerce.number().optional().default(1),
  pageSize: z.coerce.number().optional().default(50),
  q: z.string().optional(),
  /** Exact match on `ReportRun.batch_id` (pipeline `data.batchId`). */
  batchId: z.string().optional(),
})

const queryBatchIds = z.object({
  limit: z.coerce.number().optional().default(400),
})

/**
 * Postgres-backed BullMQ run archive (Jobbstatus history in Validate).
 * Requires auth; mounted at `api/queue-archive`.
 */
export async function queueArchiveReadRoutes(app: FastifyInstance) {
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
      const data = await listArchivedReportRuns({
        page: q.page,
        pageSize: q.pageSize,
        q: q.q,
        batchId: q.batchId,
      })
      return reply.send(data)
    },
  )

  app.get(
    '/batch-ids',
    {
      schema: {
        summary: 'Distinct batch ids present on archived runs',
        tags: ['Internal'],
        querystring: queryBatchIds,
        hide: true,
      },
    },
    async (request, reply) => {
      const q = queryBatchIds.parse(request.query)
      const batchIds = await listArchivedReportRunBatchIds(q.limit)
      return reply.send({ batchIds })
    },
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
    },
  )
}
