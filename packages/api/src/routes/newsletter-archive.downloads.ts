import { FastifyInstance } from 'fastify'
import {
  fetchNewsletters,
  mailchimpResponseSchema,
} from '../services/mailchimp'

export async function newsletterArchiveDownloadsRoute(app: FastifyInstance) {
  app.get(
    '/',
    {
      schema: {
        summary: 'Get all newsletters',
        description: 'Get a list of all previous newsletter campaigns',
        tags: ['Newsletters'],

        response: {
          200: mailchimpResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const campaigns = await fetchNewsletters()
        return campaigns
      } catch (error) {
        console.error('Subscribe error:', error)
        return reply.status(500).send({ error: 'Failed to subscribe user' })
      }
    }
  )
}
