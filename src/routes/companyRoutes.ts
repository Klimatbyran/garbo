import express, { Request, Response } from 'express'
import opensearch from '../opensearch'
const apicache = require('apicache')

let cache = apicache.middleware
const router = express.Router()

router.get(
  '/companies',
  cache('5 minutes'),
  async (req: Request, res: Response) => {
    try {
      const reports = await opensearch.getAllLatestApprovedReports()
      if (reports) {
        res.json(reports)
      } else {
        res.status(404).send('Company emission reports not found')
      }
    } catch (error) {
      console.error('Failed to fetch company emission reports:', error)
      res.status(500).json({ error: 'Error fetching company emission reports' })
    }
  }
)

export default router
