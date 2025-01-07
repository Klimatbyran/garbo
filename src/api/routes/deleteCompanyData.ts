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
import { emissionsService } from '../services/emissionsService'

const router = express.Router()

router.use('/', fakeAuth(prisma))

router.delete('/:wikidataId', async (req, res) => {
  const { wikidataId } = req.params
  await companyService.deleteCompany(wikidataId)
  res.status(204).send()
})

router.delete(
  '/goals/:id',
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
  '/initiatives/:id',
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
  '/reportingPeriod/:id',
  processRequest({
    params: z.object({ id: z.coerce.number() }),
  }),
  async (req, res) => {
    const { id } = req.params
    await reportingPeriodService.deleteReportingPeriod(id)
    res.status(204).send()
  }
)

router.delete(
  '/statedTotalEmissions/:id',
  processRequest({
    params: z.object({ id: z.coerce.number() }),
  }),
  async (req, res) => {
    const { id } = req.params
    await emissionsService.deleteStatedTotalEmissions(id)
    res.status(204).send()
  }
)

router.delete(
  '/biogenicEmissions/:id',
  processRequest({
    params: z.object({ id: z.coerce.number() }),
  }),
  async (req, res) => {
    const { id } = req.params
    await emissionsService.deleteBiogenicEmissions(id)
    res.status(204).send()
  }
)

router.delete(
  '/scope1/:id',
  processRequest({
    params: z.object({ id: z.coerce.number() }),
  }),
  async (req, res) => {
    const { id } = req.params
    await emissionsService.deleteScope1(id)
    res.status(204).send()
  }
)

router.delete(
  '/scope1And2/:id',
  processRequest({
    params: z.object({ id: z.coerce.number() }),
  }),
  async (req, res) => {
    const { id } = req.params
    await emissionsService.deleteScope1And2(id)
    res.status(204).send()
  }
)

router.delete(
  '/scope2/:id',
  processRequest({
    params: z.object({ id: z.coerce.number() }),
  }),
  async (req, res) => {
    const { id } = req.params
    await emissionsService.deleteScope2(id)
    res.status(204).send()
  }
)

router.delete(
  '/scope3/:id',
  processRequest({
    params: z.object({ id: z.coerce.number() }),
  }),
  async (req, res) => {
    const { id } = req.params
    await emissionsService.deleteScope3(id)
    res.status(204).send()
  }
)

router.delete(
  '/scope3Category/:id',
  processRequest({
    params: z.object({ id: z.coerce.number() }),
  }),
  async (req, res) => {
    const { id } = req.params
    await emissionsService.deleteScope3Category(id)
    res.status(204).send()
  }
)

export default router
