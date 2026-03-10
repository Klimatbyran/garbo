import { FastifyInstance, AuthenticatedFastifyRequest } from 'fastify'
import { z } from 'zod'
import { getTags } from '@/config/openapi'
import { queues } from '@/queues'
import { getErrorSchemas } from '../../schemas'

const runReportBodySchema = z.object({
  url: z.string().url(),
  tags: z.array(z.string()).optional(),
  autoApprove: z.boolean().optional(),
  forceReindex: z.boolean().optional(),
  threadId: z.string().optional(),
})

export type RunReportBody = z.infer<typeof runReportBodySchema>

const runReportResponseSchema = z.object({
  jobId: z.string().optional(),
  message: z.string(),
})

export async function pipelineRunRoutes(app: FastifyInstance) {
  app.post(
    '/run',
    {
      schema: {
        summary: 'Run report pipeline',
        description:
          'Queue a report for processing (parse PDF, extract data, sync to Garbo API). Optional tags are passed through and applied when the company is created or updated.',
        tags: getTags('Pipeline'),
        body: runReportBodySchema,
        response: {
          200: runReportResponseSchema,
          ...getErrorSchemas(400, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Body: RunReportBody }>,
      reply
    ) => {
      const { url, tags, autoApprove = false, forceReindex = false, threadId } = request.body

      try {
        const job = await queues.parsePdf.add(
          'run-report ' + url.slice(-20),
          {
            url: url.trim(),
            threadId: threadId ?? '',
            autoApprove,
            forceReindex,
            ...(tags?.length && { tags }),
          },
          {
            backoff: { type: 'fixed', delay: 60_000 },
            attempts: 10,
          }
        )
        return reply.send({
          jobId: job.id,
          message: 'Report pipeline job queued. Tags (if provided) will be applied when the company is created or updated.',
        })
      } catch (error) {
        console.error('Pipeline run error:', error)
        return reply
          .status(500)
          .send({ message: 'Failed to queue report pipeline job.' })
      }
    }
  )
}
