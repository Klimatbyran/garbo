import express from 'express'
import pino from 'pino-http'
import swaggerJsdoc from 'swagger-jsdoc'
import { apiReference } from '@scalar/express-api-reference'

import readCompaniesRouter from './api/routes/company.read'
import updateCompanyRouter from './api/routes/company.update'
import deleteCompanyData from './api/routes/company.delete'
import companyGoalsRouter from './api/routes/company.goals'
import companyInitiativesRouter from './api/routes/company.initiatives'
import companyIndustryRouter from './api/routes/company.industry'
import companyReportingPeriodsRouter from './api/routes/company.reportingPeriods'

import {
  createMetadata,
  fakeAuth,
  validateMetadata,
} from './api/middlewares/middlewares'
import { errorHandler } from './api/middlewares/errorhandler'
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
apiRouter.use('/', express.json())

// API Routes

apiRouter.use('/companies', readCompaniesRouter)

apiRouter.use('/companies', fakeAuth(prisma))
apiRouter.use('/companies', deleteCompanyData)

apiRouter.use('/companies', validateMetadata(), createMetadata(prisma))
apiRouter.use(
  '/companies/:wikidataId',
  processRequestParams(wikidataIdParamSchema)
)

apiRouter.use('/companies', updateCompanyRouter)
apiRouter.use('/companies', companyIndustryRouter)
apiRouter.use('/companies', companyGoalsRouter)
apiRouter.use('/companies', companyInitiativesRouter)

apiRouter.use('/companies', companyReportingPeriodsRouter)

// Generate and publish OpenAPI documentation
const openApiSpec = swaggerJsdoc(swaggerOptions)
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

apiRouter.use(errorHandler)

export default apiRouter
