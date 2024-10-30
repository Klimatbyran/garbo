import express from 'express'
import pino from 'pino-http'
import readCompanies from './routes/readCompanies'
import updateCompanies from './routes/updateCompanies'
import { errorHandler } from './routes/middlewares'

const apiRouter = express.Router()

const pinoConfig = process.stdin.isTTY
  ? {
      transport: {
        target: 'pino-pretty',
      },
      level: 'info',
    }
  : undefined

apiRouter.use(pino(pinoConfig))

apiRouter.use('/companies', readCompanies)
apiRouter.use('/companies', updateCompanies)

// TODO: Why does this error handler not capture errors thrown in readCompanies?
apiRouter.use(errorHandler)

apiRouter.use(
  pino(
    process.stdin.isTTY
      ? {
          transport: {
            target: 'pino-pretty',
          },
          level: 'info',
        }
      : undefined
  )
)

// TODO: Why does this error handler not capture errors thrown in readCompanies?
app.use(errorHandler)

export default apiRouter
