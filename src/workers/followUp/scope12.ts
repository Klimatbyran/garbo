import { QUEUE_NAMES } from "../../queues";
import { FollowUpJob, FollowUpWorker } from "../../lib/FollowUpWorker";
import { z } from 'zod'
import { emissionUnitSchemaGarbo } from '../../api/schemas'
import { FollowUpType } from "../../types";

const schema = z.object({
  scope12: z.array(
    z.object({
      year: z.number(),
      scope1: z
        .object({
          total: z.number(),
          unit: emissionUnitSchemaGarbo,
        })
        .nullable()
        .optional(),
      scope2: z
        .object({
          mb: z
            .number({ description: 'Market-based scope 2 emissions' })
            .nullable()
            .optional(),
          lb: z
            .number({ description: 'Location-based scope 2 emissions' })
            .nullable()
            .optional(),
          unknown: z
            .number({ description: 'Unspecified Scope 2 emissions' })
            .nullable()
            .optional(),
          unit: emissionUnitSchemaGarbo,
        })
        .refine(({ mb, lb, unknown }) => mb || lb || unknown, {
          message:
            'At least one property of `mb`, `lb` and `unknown` must be defined if scope2 is provided',
        })
        .nullable()
        .optional(),
    })
  ),
})

const prompt = `
*** Golden Rule ***
- Extract values only if explicitly available in the context. Do not infer or create data. Leave optional fields absent or explicitly set to null if no data is provided.

Extract scope 1 and 2 emissions according to the GHG protocol (CO2e). Include all years you can find and never exclude the latest year.
Include market-based and location-based in scope 2. 

**Units**:
- Always report emissions in metric tons (**tCO2e** or **tCO2**). The unit **tCO2e** (tons of CO2 equivalent) is preferred.
- If a company explicitly reports emissions without the "e" suffix (e.g., **tCO2**), use **tCO2** as the unit. However, if no unit is specified or it is unclear, assume the unit is **tCO2e**.
- All values must be converted to metric tons if they are provided in other units:
  - Example: 
    - 1000 CO2e → 1 tCO2e
    - 1000 CO2 → 1 tCO2
    - 1 kton CO2e → 1000 tCO2e
    - 1 Mton CO2 → 1,000,000 tCO2
- Use **tCO2** only if it is explicitly reported without the "e" suffix, otherwise default to **tCO2e**.


NEVER CALCULATE ANY EMISSIONS. ONLY REPORT THE DATA AS IT IS IN THE PDF. If you can't find any data or if you are uncertain, report it as null. Do not use markdown in the output.

*** Example***
This is only an example format; do not include this specific data in the output and do not use markdown in the output:
{
  "scope12": [{
    "year": 2023,
    "scope1": {
      "total": 12.3,
      "unit": "tCO2e"
    },
    "scope2": {
      "mb": 23.4,
      "lb": 34.5,
      "unknown": null
      "unit": "tCO2e"
    }
  }]
`

const queryTexts = [
  'Scope 1 and 2 emissions',
  'Market-based and location-based emissions',
  'GHG protocol Scope 1 and 2 data',
  'carbon emissions CO2',
  'CO2-eq',
  'CO2 emissions',
  'Scope 1 and 2',
  'Scope 1',
  'Scope 2',
  'CO2e',
  'tCO2e',
  'GHG Protocol',
  'emissions',
  'carbon footprint',
  'carbon accounting',
  'carbon emissions',
  'carbon emissions data',
  'carbon emissions report',
  'carbon emissions calculation',
]

const followUpScope12 = new FollowUpWorker<FollowUpJob>(
    QUEUE_NAMES.FOLLOW_UP_SCOPE_12,
    async (job) => {
        const { url, previousAnswer } = job.data;
        const answer = await job.followUp(url, previousAnswer, schema, prompt, queryTexts, FollowUpType.Scope12);
        return answer;
    }
);

export default followUpScope12;
