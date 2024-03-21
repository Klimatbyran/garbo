import express, { Request, Response } from 'express';
import elastic from '../elastic';

const router = express.Router();

router.get('/company-emission-reports', async (req: Request, res: Response) => {
    try {
        const reports = await elastic.getAllLatestApprovedReports();
        if (reports) {
            res.json(reports);
        } else {
            res.status(404).send('Company emission reports not found');
        }
    } catch (error) {
        console.error('Failed to fetch company emission reports:', error);
        res.status(500).send('Error fetching company emission reports');
    }
});

export default router;
