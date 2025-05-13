import { FastifyReply, FastifyRequest, FastifyError } from 'fastify'
import { Prisma } from '@prisma/client'

import apiConfig from '../../config/api'

export function errorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error(error)

  if ((error as FastifyError)?.validation) {
    const fastifyError = error as FastifyError

    reply.status(400).send({
      code: 'VALIDATION_ERROR',
      message: fastifyError.message,
      details: apiConfig.nodeEnv === 'development' ? fastifyError : fastifyError.validation,
    })
  } else if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  ) {
    reply.status(404).send({
      code: 'NOT_FOUND',
      message: 'The requested resource could not be found.',
      details: apiConfig.nodeEnv === 'development' ? error : undefined,
    })
  } else {
    reply.status(500).send({
      code: 'INTERNAL_SERVER_ERROR',
      message: apiConfig.nodeEnv === 'development' ? error.message : 'An unexpected error occurred.',
      details: apiConfig.nodeEnv === 'development' ? error : undefined,
    })
  }
}
