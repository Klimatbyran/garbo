import express from 'express'
import { wikidataIdParamSchema } from '../../openapi/schemas'
import { prisma } from '../../lib/prisma'
import { GarboAPIError } from '../../lib/garbo-api-error'
import { industryService } from '../services/industryService'
import { processRequest } from '../middlewares/zod-middleware'
import { postIndustrySchema } from '../schemas'

const router = express.Router()

/**
 * @swagger
 * /companies/{wikidataId}/industry:
 *   post:
 *     summary: Update company industry classification
 *     description: Update or create industry classification for a company
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
 *               $ref: '#/components/schemas/Industry'
 *     responses:
 *       200:
 *         description: Industry updated successfully
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
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:wikidataId/industry',
  processRequest({
    body: postIndustrySchema,
    params: wikidataIdParamSchema,
  }),
  async (req, res) => {
    const { industry } = req.body
    // NOTE: This extra check is only necessary because we don't get correct TS types from the zod middleware processRequest().
    // Ideally, we could update the generic types of the zod-middleware to return the exact inferred schema, instead of turning everything into optional fields.
    const subIndustryCode = industry?.subIndustryCode
    if (!subIndustryCode) {
      throw new GarboAPIError('Unable to update industry')
    }

    const { wikidataId } = req.params
    const metadata = res.locals.metadata

    const current = await prisma.industry.findFirst({
      where: { companyWikidataId: wikidataId },
    })

    if (current) {
      console.log('updating industry', subIndustryCode)
      await industryService
        .updateIndustry(wikidataId, { subIndustryCode }, metadata!)
        .catch((error) => {
          throw new GarboAPIError('Failed to update industry', {
            original: error,
            statusCode: 500,
          })
        })
    } else {
      console.log('creating industry', subIndustryCode)
      await industryService
        .createIndustry(wikidataId, { subIndustryCode }, metadata!)
        .catch((error) => {
          throw new GarboAPIError('Failed to create industry', {
            original: error,
            statusCode: 500,
          })
        })
    }

    res.json({ ok: true })
  }
)

export default router
