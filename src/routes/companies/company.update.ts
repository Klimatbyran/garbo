import express from 'express'
import { processRequestBody } from '../zod-middleware'
import { upsertCompany } from '../../lib/prisma'
import { GarboAPIError } from '../../lib/garbo-api-error'
import { CompanyInputSchema } from '../../openapi/registry'

const router = express.Router()

/**
 * @swagger
 * /companies:
 *   post:
 *     summary: Create or update a company
 *     description: Creates a new company or updates an existing one based on wikidataId
 *     tags: [Companies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompanyInput'
 *     responses:
 *       200:
 *         description: Company created/updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
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
router.post('/', processRequestBody(CompanyInputSchema), async (req, res) => {
  const { name, description, url, internalComment, wikidataId } = req.body

  try {
    const company = await upsertCompany({
      wikidataId,
      name,
      description,
      url,
      internalComment,
    })
    res.json(company)
  } catch (error) {
    throw new GarboAPIError('Failed to upsert company', {
      original: error,
    })
  }
})

// Export the router
export default router
