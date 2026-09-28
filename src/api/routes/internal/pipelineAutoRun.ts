import type { FastifyInstance } from 'fastify'
import {
  getPipelineAutoRunStatus,
  patchPipelineAutoRunConfig,
  PipelineAutoRunConfigUnavailableError,
} from '../../services/pipelineAutoRunService'
import {
  pipelineAutoRunPatchSchema,
  type PipelineAutoRunPatch,
} from '../../services/pipelineAutoRunTypes'

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
        request.log.error({ err }, 'pipeline-auto-run GET failed')
        if (err instanceof PipelineAutoRunConfigUnavailableError) {
          return reply.status(503).send({
            code: err.code,
            message: err.message,
          })
        }
        throw err
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
        if (err instanceof PipelineAutoRunConfigUnavailableError) {
          return reply.status(503).send({
            code: err.code,
            message: err.message,
          })
        }
        return reply.status(400).send({
          error: err instanceof Error ? err.message : 'Invalid auto-run config',
        })
      }
    }
  )
}
