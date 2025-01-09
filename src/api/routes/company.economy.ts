import express from 'express'
import { GarboAPIError } from '../../lib/garbo-api-error'
import { postEconomySchema } from '../schemas'
import { processRequestBody } from '../middlewares/zod-middleware'
import { companyService } from '../services/companyService'

const router = express.Router()

/**
 * @swagger
 * /companies/{wikidataId}/{year}/economy:
 *   post:
 *     summary: Company economy
 *     description: Economy for a specific company
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
 *              $ref: '#/components/schemas/Economy'
 *     responses:
 *       200:
 *         description: Economy created successfully
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
  '/:wikidataId/:year/economy',
  processRequestBody(postEconomySchema),
  async (req, res) => {
    const parsedBody = postEconomySchema.parse(req.body)
    const { turnover, employees } = parsedBody.economy ?? {}

    const metadata = res.locals.metadata!
    const economy = res.locals.economy!

    // Normalise currency
    if (turnover) {
      turnover.currency = turnover?.currency?.trim()?.toUpperCase()
    }

    try {
      // Only update if the input contains relevant changes
      await Promise.allSettled([
        turnover &&
          companyService.upsertTurnover({ economy, metadata, turnover }),
        employees &&
          companyService.upsertEmployees({ economy, employees, metadata }),
      ])
    } catch (error) {
      throw new GarboAPIError('Failed to update economy', {
        original: error,
        statusCode: 500,
      })
    }

    res.json({ ok: true })
  }
)

export default router
