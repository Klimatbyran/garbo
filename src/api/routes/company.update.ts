import express from 'express'
import {
  ensureCompany,
  validateCompanyRequest,
} from '../middlewares/middlewares'

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
router.post('/', validateCompanyRequest(), ensureCompany)
router.post('/:wikidataId', validateCompanyRequest(), ensureCompany)

export default router
