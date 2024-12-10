import express from 'express'
import { processRequestBody } from '../zod-middleware'
import { upsertCompany } from '../../lib/prisma'
import { GarboAPIError } from '../../lib/garbo-api-error'
import { CompanyInputSchema } from '../../openapi/registry'

const router = express.Router()

/**
 * POST handler for creating/updating companies
 * @route POST /companies
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

export default router
