import express from 'express'
import { fakeAuth } from '../middlewares/middlewares'
import { companyService } from '../services/companyService'
import { processRequest } from '../middlewares/zod-middleware'
import { z } from 'zod'
import { goalService } from '../services/goalService'
import { industryService } from '../services/industryService'
import { initiativeService } from '../services/initiativeService'
import { reportingPeriodService } from '../services/reportingPeriodService'
import { prisma } from '../../lib/prisma'

const router = express.Router()

router.use('/', fakeAuth(prisma))

router.delete('/:wikidataId', async (req, res) => {
  const { wikidataId } = req.params
  await companyService.deleteCompany(wikidataId)
  res.status(204).send()
})

router.delete(
  '/:wikidataId/goals/:id',
  processRequest({
    params: z.object({ id: z.coerce.number() }),
  }),
  async (req, res) => {
    const { id } = req.params
    await goalService.deleteGoal(id)
    res.status(204).send()
  }
)

router.delete('/:wikidataId/industry', async (req, res) => {
  const { wikidataId } = req.params
  await industryService.deleteIndustry(wikidataId)
  res.status(204).send()
})

router.delete(
  '/:wikidataId/initiatives/:id',
  processRequest({
    params: z.object({ id: z.coerce.number() }),
  }),
  async (req, res) => {
    const { id } = req.params
    await initiativeService.deleteInitiative(id)
    res.status(204).send()
  }
)

router.delete(
  '/:wikidataId/reportingPeriod/:id',
  processRequest({
    params: z.object({ id: z.coerce.number() }),
  }),
  async (req, res) => {
    const { id } = req.params
    await reportingPeriodService.deleteReportingPeriod(id)
    res.status(204).send()
  }
)

export default router
