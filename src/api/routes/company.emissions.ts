import express from 'express'
import { GarboAPIError } from '../../lib/garbo-api-error'
import { postEmissionsSchema } from '../schemas'
import { processRequestBody } from '../middlewares/zod-middleware'
import { emissionsService } from '../services/emissionsService'
import { ensureEmissionsExists } from '../middlewares/middlewares'
import { prisma } from '../../lib/prisma'

const router = express.Router()

router.use('/:wikidataId/:year/emissions', ensureEmissionsExists(prisma))

/**
 * @swagger
 * /companies/{wikidataId}/{year}/emissions:
 *   post:
 *     summary: Company emissions
 *     description: Emissions for a specific company
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: wikidataId
 *         required: true
 *         schema:
 *           type: string
 *         description: Wikidata ID of the company
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *              $ref: '#/components/schemas/Emissions'
 *     responses:
 *       200:
 *         description: Emissions created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       404:
 *         description: Company not found
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:wikidataId/:year/emissions',
  processRequestBody(postEmissionsSchema),
  async (req, res) => {
    const { emissions = {} } = postEmissionsSchema.parse(req.body)
    const {
      scope1,
      scope2,
      scope3,
      scope1And2,
      statedTotalEmissions,
      biogenic,
    } = emissions

    const metadata = res.locals.metadata!
    const dbEmissions = res.locals.emissions!

    try {
      // Only update if the input contains relevant changes
      await Promise.allSettled([
        scope1 && emissionsService.upsertScope1(dbEmissions, scope1, metadata),
        scope2 && emissionsService.upsertScope2(dbEmissions, scope2, metadata),
        scope3 && emissionsService.upsertScope3(dbEmissions, scope3, metadata),
        scope1And2 &&
          emissionsService.upsertScope1And2(dbEmissions, scope1And2, metadata),
        statedTotalEmissions &&
          emissionsService.upsertStatedTotalEmissions(
            dbEmissions,
            metadata,
            statedTotalEmissions
          ),
        biogenic &&
          emissionsService.upsertBiogenic(dbEmissions, biogenic, metadata),
      ])
    } catch (error) {
      throw new GarboAPIError('Failed to update emissions', {
        original: error,
        statusCode: 500,
      })
    }

    res.json({ ok: true })
  }
)

export default router
