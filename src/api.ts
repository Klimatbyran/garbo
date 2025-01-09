import express from 'express'
import pino from 'pino-http'
import swaggerJsdoc from 'swagger-jsdoc'
import { apiReference } from '@scalar/express-api-reference'

import readCompanies from './api/routes/company.read'
import updateCompanies from './api/routes/company.update'
import deleteCompanyData from './api/routes/company.delete'
import {
  createMetadata,
  ensureEconomyExists,
  ensureEmissionsExists,
  ensureReportingPeriod,
  errorHandler,
  fakeAuth,
  fetchCompanyByWikidataId,
  validateMetadata,
  validateReportingPeriodRequest,
} from './api/middlewares/middlewares'
import { swaggerOptions } from './swagger'
import { prisma } from './lib/prisma'
import { processRequestParams } from './api/middlewares/zod-middleware'
import { wikidataIdParamSchema } from './api/schemas'

const apiRouter = express.Router()
const pinoConfig = process.stdin.isTTY && {
  transport: {
    target: 'pino-pretty',
  },
  level: 'info',
}
apiRouter.use(pino(pinoConfig || undefined))

// API Routes
// Generate OpenAPI spec
const openApiSpec = swaggerJsdoc(swaggerOptions)

apiRouter.use('/companies', express.json())

// API Routes

apiRouter.use('/companies', readCompanies)

apiRouter.use('/companies', fakeAuth(prisma))
apiRouter.use('/companies', deleteCompanyData)

apiRouter.use('/companies', validateMetadata(), createMetadata(prisma))
apiRouter.use(
  '/companies/:wikidataId',
  processRequestParams(wikidataIdParamSchema),
  fetchCompanyByWikidataId(prisma)
)
apiRouter.use(
  '/companies/:wikidataId/:year',
  validateReportingPeriodRequest(),
  ensureReportingPeriod(prisma)
)
apiRouter.use('/:wikidataId/:year/emissions', ensureEmissionsExists(prisma))
apiRouter.use('/:wikidataId/:year/economy', ensureEconomyExists(prisma))
apiRouter.use('/companies', updateCompanies)

// API Documentation
apiRouter.get('/openapi.json', (_req, res) => {
  res.json(openApiSpec)
})
apiRouter.use(
  '/',
  apiReference({
    spec: {
      url: '/api/openapi.json',
    },
  })
)

// TODO: Why does this error handler not capture errors thrown in readCompanies?
apiRouter.use(errorHandler)

export default apiRouter
