import { QUEUE_NAMES } from '../../queues'
import { FollowUpJob, FollowUpWorker } from '../../lib/FollowUpWorker'
import { FollowUpType } from '../../types'
import { schema } from '../../jobs/economy/schema'
import { prompt } from '../../jobs/economy/prompt'
import { queryTexts } from '../../jobs/economy/queryTexts'

// NOTE: Maybe split turnover, revenue, and employees into separate follow-ups to allow re-running them separately

const economy = new FollowUpWorker<FollowUpJob>(
  QUEUE_NAMES.FOLLOW_UP_ECONOMY,
  async (job) => {
    const { url, previousAnswer } = job.data
    const answer = await job.followUp(
      url,
      previousAnswer,
      schema,
      prompt,
      queryTexts,
      FollowUpType.Economy
    )
    return answer
  }
)

export { schema, prompt, queryTexts }
export default economy
