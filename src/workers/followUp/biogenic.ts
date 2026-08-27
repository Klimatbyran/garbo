import { QUEUE_NAMES } from '../../queues'
import { FollowUpJob, FollowUpWorker } from '../../lib/FollowUpWorker'
import { z } from 'zod'
import { emissionUnitSchemaGarbo } from '../../api/schemas'
import { FollowUpType } from '../../types'

const schema = z.object({
  biogenic: z.array(
    z.object({
      year: z.number(),
      biogenic: z.object({
        total: z.number(),
        unit: emissionUnitSchemaGarbo,
      }),
    })
  ),
})

const prompt = `BIOGENIC EMISSIONS
Biogenic emissions are emissions from the combustion of biomass, not to be confused with fossil fuel emissions.

Extract biogenic emissions according to the GHG protocol. Include all years you can find and never exclude the latest year.
Always use tonnes CO2e as the unit, so if emissions are presented in other units (for example, in kilotonnes), convert this to tonnes.
NEVER CALCULATE ANY EMISSIONS. ONLY REPORT THE DATA AS IT IS IN THE PDF.

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



If you can't find any information about biogenic emissions, report it as null.
If you find biogenic emissions for some years but not for others, report the years you find and leave the others out.

Json example:
{
  "biogenic": [{
    "year": 2021,
    "biogenic": {
      "total: 12.3,
      "unit": "tCO2e"
      
    }
  }]
}
`

const queryTexts = [
  'Biogenic emissions according to the GHG protocol (CO2e).',
  'Total biogenic CO2e emissions by year.',
  'Latest year with biogenic CO2e emissions data.',
]

const biogenic = new FollowUpWorker<FollowUpJob>(
  QUEUE_NAMES.FOLLOW_UP_BIOGENIC,
  async (job) => {
    const { url, previousAnswer } = job.data
    const answer = await job.followUp(
      url,
      previousAnswer,
      schema,
      prompt,
      queryTexts,
      FollowUpType.Biogenic
    )
    return answer
  }
)

export default biogenic
