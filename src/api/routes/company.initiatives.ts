import express from 'express'
import { z } from 'zod'
import { wikidataIdParamSchema } from '../../openapi/schemas'
import { Prisma } from '@prisma/client'
import { GarboAPIError } from '../../lib/garbo-api-error'
import { processRequest } from '../middlewares/zod-middleware'
import { postInitiativeSchema, postInitiativesSchema } from '../schemas'
import { initiativeService } from '../services/initiativeService'

const router = express.Router()

/**
 * @swagger
 * /companies/{wikidataId}/initiatives:
 *   post:
 *     summary: Create company initiatives
 *     description: Create new initiatives for a specific company
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
 *             $ref: '#/components/schemas/Initiatives'
 *     responses:
 *       200:
 *         description: Initiatives created successfully
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
  '/:wikidataId/initiatives',
  processRequest({
    body: postInitiativesSchema,
    params: wikidataIdParamSchema,
  }),
  async (req, res) => {
    const { initiatives } = req.body
    console.log('initiatives', initiatives)

    if (initiatives?.length) {
      const { wikidataId } = req.params
      const metadata = res.locals.metadata

      await initiativeService.createInitiatives(
        wikidataId,
        initiatives,
        metadata!
      )
    }
    res.json({ ok: true })
  }
)

/**
 * @swagger
 * /companies/{wikidataId}/initiatives/{id}:
 *   patch:
 *     summary: Update a company initiative
 *     description: Update an existing initiative for a specific company
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
 *         description: Initiative ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Initiative'
 *     responses:
 *       200:
 *         description: Initiative updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       404:
 *         description: Initiative not found
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
  '/:wikidataId/initiatives/:id',
  processRequest({
    body: postInitiativeSchema,
    params: z.object({ id: z.coerce.number() }),
  }),
  async (req, res) => {
    const { initiative } = req.body
    const { id } = req.params
    const metadata = res.locals.metadata
    await initiativeService
      .updateInitiative(id, initiative, metadata!)
      .catch((error) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new GarboAPIError('Initiative not found', {
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
