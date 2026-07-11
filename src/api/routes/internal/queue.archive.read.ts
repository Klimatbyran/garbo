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
  /** Comma-separated CompanyReport ids — narrows archive for Validate overview. */
  companyReportIds: z.string().optional(),
  /** Comma-separated exact `ReportRun.pdfUrl` values — registry gap overview lookup. */
  pdfUrls: z.string().optional(),
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

/** GET-only archive routes for the X-API-Key client API mount. */
export async function queueArchiveInternalReadRoutes(app: FastifyInstance) {
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
      const companyReportIdSet = new Set<string>()
      for (const part of (q.companyReportIds ?? '').split(',')) {
        const t = part.trim()
        if (t) companyReportIdSet.add(t)
      }
      const companyReportIds = [...companyReportIdSet]
      const pdfUrlSet = new Set<string>()
      for (const part of (q.pdfUrls ?? '').split(',')) {
        const t = part.trim()
        if (t) pdfUrlSet.add(t)
      }
      const pdfUrls = [...pdfUrlSet]
      const batchIdSet = new Set<string>()
      for (const part of (q.batchDbIds ?? '').split(',')) {
        const t = part.trim()
        if (t) batchIdSet.add(t)
      }
      const single = q.batchDbId?.trim()
      if (single) batchIdSet.add(single)
      const batchDbIds = [...batchIdSet]
      const data = await listArchivedReportRuns({
        page: q.page,
        pageSize: q.pageSize,
        q: q.q,
        companyReportIds:
          companyReportIds.length > 0 ? companyReportIds : undefined,
        pdfUrls: pdfUrls.length > 0 ? pdfUrls : undefined,
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

/**
 * Full archive surface for staff JWT (Validate Jobbstatus).
 * Twin read routes: `api/internal-queue-archive` (X-API-Key, GET only).
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

  await queueArchiveInternalReadRoutes(app)
}
