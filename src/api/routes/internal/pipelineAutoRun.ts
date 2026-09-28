import type { FastifyInstance } from 'fastify'
import {
  getPipelineAutoRunStatus,
  patchPipelineAutoRunConfig,
} from '../../services/pipelineAutoRunService'
import {
  pipelineAutoRunPatchSchema,
  type PipelineAutoRunPatch,
} from '../../services/pipelineAutoRunTypes'

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback
}

/**
 * Staff JWT control surface for Validate auto-run (backlog drain).
 * Soft disable: PATCH enabled=false stops new enqueues only.
 */
export async function pipelineAutoRunRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      schema: {
        summary: 'Get pipeline auto-run config and live status',
        tags: ['Internal'],
        hide: true,
      },
    },
    async (request, reply) => {
      try {
        const status = await getPipelineAutoRunStatus()
        return reply.send(status)
      } catch (err) {
        // Surface the real cause (e.g. missing migration) — global handler hides
        // messages in production and Validate only shows this body.
        request.log.error({ err }, 'pipeline-auto-run GET failed')
        return reply.status(500).send({
          error: errorMessage(err, 'pipeline-auto-run status failed'),
        })
      }
    }
  )

  app.patch(
    '/',
    {
      schema: {
        summary: 'Update pipeline auto-run config (on/off, filters, options)',
        tags: ['Internal'],
        body: pipelineAutoRunPatchSchema,
        hide: true,
      },
    },
    async (request, reply) => {
      // Body already validated by Fastify + Zod type provider.
      const body = request.body as PipelineAutoRunPatch
      const updatedBy =
        request.user && typeof request.user === 'object'
          ? ((request.user as { id?: string }).id ?? null)
          : null
      try {
        const status = await patchPipelineAutoRunConfig(body, updatedBy)
        return reply.send(status)
      } catch (err) {
        request.log.error({ err }, 'pipeline-auto-run PATCH failed')
        const message = errorMessage(err, 'Invalid auto-run config')
        // Prisma / infra failures are not client validation errors.
        const statusCode = /P\d{4}|does not exist|unavailable|ECONN/i.test(
          message
        )
          ? 500
          : 400
        return reply.status(statusCode).send({ error: message })
      }
    }
  )
}
