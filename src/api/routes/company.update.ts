import express, { Request, Response } from 'express'

import { processRequestBody } from '../middlewares/zod-middleware'
import { companyService } from '../services/companyService'
import { upsertCompanyBodySchema } from '../schemas'

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
router.post(
  '/',
  processRequestBody(upsertCompanyBodySchema),
  async (req: Request, res: Response) => {
    const { name, wikidataId, description, internalComment, tags, url } =
      req.body
    await companyService.upsertCompany({
      name,
      wikidataId,
      description,
      internalComment,
      tags,
      url,
    })

    res.json({ ok: true })
  }
)

export default router
