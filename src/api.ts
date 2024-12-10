import express from 'express'
import pino from 'pino-http'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { createExpressMiddleware } from '@scalar/express-api-reference'
import readCompanies from './routes/readCompanies'
import updateCompanies from './routes/updateCompanies'
import { errorHandler } from './routes/middlewares'
import { swaggerOptions } from './swagger'

const apiRouter = express.Router()
const pinoConfig = process.stdin.isTTY && {
  transport: {
    target: 'pino-pretty',
  },
  level: 'info',
}
apiRouter.use(pino(pinoConfig || undefined))
// API Documentation
const specs = swaggerJsdoc(swaggerOptions)
apiRouter.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(specs)
})

// Swagger UI
apiRouter.use('/docs/swagger', swaggerUi.serve)
apiRouter.get('/docs/swagger', swaggerUi.setup(specs))

// Scalar UI
apiRouter.use('/docs', createExpressMiddleware({ spec: specs }))

// API Routes
apiRouter.use('/companies', readCompanies)
apiRouter.use('/companies', updateCompanies)

// TODO: Why does this error handler not capture errors thrown in readCompanies?
apiRouter.use(errorHandler)

export default apiRouter
