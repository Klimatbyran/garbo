import { QUEUE_NAMES } from "../../queues";
import { FollowUpJob, FollowUpWorker } from "../../lib/FollowUpWorker";

import { z } from 'zod'
import { FollowUpType } from "../../types";

const schema = z.object({
  fiscalYear: z.object({
    startMonth: z.number(),
    endMonth: z.number(),
  }),
})

const prompt = `
Extract the company fiscal year. Sometimes companies have fiscal year which does not align with the calendar year.

Example: 1 apr -> 31 mar means:
startMonth = 4, endMonth = 3.

Standard is 1 jan -> 31 dec which is default and if nothing is mentioned in the report, please return these as default.

Example:
\`\`\`json
{
  "fiscalYear": {
    "startMonth": 1,
    "endMonth": 12
  }
}
\`\`\`
`

const queryTexts = [
  'Fiscal year start and end months',
  'Company fiscal year',
  'Fiscal year dates',
]

const fiscalYear = new FollowUpWorker<FollowUpJob>(
    QUEUE_NAMES.FOLLOW_UP_FISCAL_YEAR,
    async (job) => {
        const { url, previousAnswer } = job.data;
                const answer = await job.followUp(url, previousAnswer, schema, prompt, queryTexts, FollowUpType.FiscalYear);
        return answer;
    }
);

export default fiscalYear;
