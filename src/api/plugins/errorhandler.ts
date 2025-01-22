import { FastifyReply, FastifyRequest } from 'fastify'
import { Prisma } from '@prisma/client'

import apiConfig from '../../config/api'

export function errorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error(error)

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  ) {
    reply.status(404).send({
      code: 'NOT_FOUND',
      message: 'The requested resource could not be found.',
      details: apiConfig.DEV ? error : undefined,
    })
  } else {
    reply.status(500).send({
      code: 'INTERNAL_SERVER_ERROR',
      message: apiConfig.DEV ? error.message : 'An unexpected error occurred.',
      details: apiConfig.DEV ? error : undefined,
    })
  }
}
