import { FastifyReply, FastifyRequest } from 'fastify'

import { GarboAPIError } from '../../lib/garbo-api-error'

export const errorHandler = (
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  request.log.error(error)

  if (error instanceof GarboAPIError) {
    request.log.error(error.original)
    return reply.code(error.statusCode).send({
      error: error.message,
      details: error.original,
      help: 'Contact support if the problem persists',
    })
  }

  reply.code(500).send({
    error: 'Internal Server Error',
    help: 'Contact support if the problem persists',
  })
}
