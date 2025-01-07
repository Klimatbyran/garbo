import express from 'express'
import pino from 'pino-http'
import readCompanies from './api/routes/readCompanies'
import updateCompanies from './api/routes/updateCompanies'
import deleteCompanyData from './api/routes/deleteCompanyData'
import { errorHandler } from './api/middlewares/middlewares'

const apiRouter = express.Router()
const pinoConfig = process.stdin.isTTY && {
  transport: {
    target: 'pino-pretty',
  },
  level: 'info',
}
apiRouter.use(pino(pinoConfig || undefined))
apiRouter.use('/companies', readCompanies)
apiRouter.use('/companies', updateCompanies)
apiRouter.use('/companies', deleteCompanyData)

// TODO: Why does this error handler not capture errors thrown in readCompanies?
apiRouter.use(errorHandler)

export default apiRouter
