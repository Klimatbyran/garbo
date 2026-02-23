import { QUEUE_NAMES } from '../../queues'
import { FollowUpJob, FollowUpWorker } from '../../lib/FollowUpWorker'
import { z } from 'zod'
import { FollowUpType } from '../../types'

// TODO: In the future, import the schemas from a shared place
export const schema = z.object({
  goals: z.array(
    z.object({
      description: z.string(),
      year: z.string().optional(),
      target: z.number().optional(),
      baseYear: z.string().optional(),
    }),
  ),
})

export const prompt = `
Extract the company goals for reducing their carbon emissions.
Be as accurate as possible when extracting goals. These values will be plotted in a graph later on.


Prioritize the list and only include the most important goals. If the list is long, only include max three most important ones (prioritize climate goals).

If no year is mentioned, set year to null.

** LANGUAGE: WRITE IN SWEDISH. If text is in English, translate to Swedish **

Example: Ensure the output is in JSON format and do not use markdown.
\`\`\`json
{
  "goals": [
    {
      "description": "Minska utsläppen med X%",
      "year": null,
      "target": null,
      "baseYear": null
    }
  ]
}
\`\`\``

const queryTexts = [
  'Climate goals',
  'Emission reduction targets',
  'Company sustainability goals',
]

const goals = new FollowUpWorker<FollowUpJob>(
  QUEUE_NAMES.FOLLOW_UP_GOALS,
  async (job) => {
    const { url, previousAnswer } = job.data
    const answer = await job.followUp(
      url,
      previousAnswer,
      schema,
      prompt,
      queryTexts,
      FollowUpType.Goals,
    )
    return answer
  },
)

export default goals
