import express from 'express'
import { z } from 'zod'
import { wikidataIdParamSchema } from '../../openapi/schemas'
import { Prisma } from '@prisma/client'
import { GarboAPIError } from '../../lib/garbo-api-error'
import { postGoalSchema, postGoalsSchema } from '../schemas'
import { goalService } from '../services/goalService'
import { processRequest } from '../middlewares/zod-middleware'

const router = express.Router()

/**
 * @swagger
 * /companies/{wikidataId}/goals:
 *   post:
 *     summary: Create company goals
 *     description: Create new goals for a specific company
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
 *              $ref: '#/components/schemas/Goals'
 *     responses:
 *       200:
 *         description: Goals created successfully
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
  '/:wikidataId/goals',
  processRequest({
    body: postGoalsSchema,
    params: wikidataIdParamSchema,
  }),
  async (req, res) => {
    const { goals } = req.body

    if (goals?.length) {
      const { wikidataId } = req.params
      const metadata = res.locals.metadata

      await goalService.createGoals(wikidataId, goals, metadata!)
    }
    res.json({ ok: true })
  }
)

/**
 * @swagger
 * /companies/{wikidataId}/goals/{id}:
 *   patch:
 *     summary: Update a company goal
 *     description: Update an existing goal for a specific company
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: wikidataId
 *         required: true
 *         schema:
 *           type: string
 *         description: Wikidata ID of the company
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Goal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *               $ref: '#/components/schemas/Goal'
 *     responses:
 *       200:
 *         description: Goal updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       404:
 *         description: Goal not found
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
  '/:wikidataId/goals/:id',
  processRequest({
    body: postGoalSchema,
    params: z.object({ id: z.coerce.number() }),
  }),
  async (req, res) => {
    const { goal } = req.body
    const { id } = req.params
    const metadata = res.locals.metadata
    await goalService.updateGoal(id, goal, metadata!).catch((error) => {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new GarboAPIError('Goal not found', {
          statusCode: 404,
          original: error,
        })
      }
      throw error
    })
    res.json({ ok: true })
  }
)

export default router
