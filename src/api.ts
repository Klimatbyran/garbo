import express from 'express'
import pino from 'pino-http'
import readCompanies from './routes/readCompanies'
import updateCompanies from './routes/updateCompanies'
import { errorHandler } from './routes/middlewares'

const apiRouter = express.Router()

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

apiRouter.use('/companies', readCompanies)
apiRouter.use('/companies', updateCompanies)

// TODO: Why does this error handler not capture errors thrown in readCompanies?
apiRouter.use(errorHandler)

import pino from 'pino-http'
import { errorHandler } from './routes/middlewares'

const app = express()

app.use(
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

app.use('/api', apiRouter)

// TODO: Why does this error handler not capture errors thrown in readCompanies?
app.use(errorHandler)

export default app
