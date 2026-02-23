import { QUEUE_NAMES } from '../../queues'
import { FollowUpJob, FollowUpWorker } from '../../lib/FollowUpWorker'
import { FollowUpType } from '../../types'
import { prompt } from '../../jobs/scope3/prompt'
import { queryTexts } from '../../jobs/scope3/queryTexts'
import { schema } from '../../jobs/scope3/schema'

const followUpScope3 = new FollowUpWorker<FollowUpJob>(
  QUEUE_NAMES.FOLLOW_UP_SCOPE_3,
  async (job) => {
    const { url, previousAnswer } = job.data
    const answer = await job.followUp(
      url,
      previousAnswer,
      schema,
      prompt,
      queryTexts,
      FollowUpType.Scope3,
    )
    return answer
  },
)

export default followUpScope3
