import express from 'express'
import { z } from 'zod'
import { processRequest } from '../zod-middleware'
import { createIndustry, updateIndustry } from '../../lib/prisma'
import { wikidataIdParamSchema } from '../../openapi/schemas'
import { prisma } from '../../lib/prisma'
import { GarboAPIError } from '../../lib/garbo-api-error'

const router = express.Router()

const industrySchema = z.object({
  industry: z.object({
    subIndustryCode: z.string(),
  }),
})

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
 *             type: object
 *             required:
 *               - industry
 *             properties:
 *               industry:
 *                 $ref: '#/components/schemas/IndustrySchema'
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
 *             type: object
 *             properties:
 *               industry:
 *                 $ref: '#/components/schemas/IndustrySchema'
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
 */
router.post(
  '/:wikidataId/industry',
  processRequest({ body: industrySchema, params: wikidataIdParamSchema }),
  async (req, res) => {
    const { industry } = req.body
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
      await updateIndustry(wikidataId, { subIndustryCode }, metadata!).catch(
        (error) => {
          throw new GarboAPIError('Failed to update industry', {
            original: error,
            statusCode: 500,
          })
        }
      )
    } else {
      console.log('creating industry', subIndustryCode)
      await createIndustry(wikidataId, { subIndustryCode }, metadata!).catch(
        (error) => {
          throw new GarboAPIError('Failed to create industry', {
            original: error,
            statusCode: 500,
          })
        }
      )
    }

    res.json({ ok: true })
  }
)

export default router
