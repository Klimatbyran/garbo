import { QUEUE_NAMES } from '../../queues'
import { FollowUpJob, FollowUpWorker } from '../../lib/FollowUpWorker'
import { FollowUpType } from '../../types'
import { schema } from '../../jobs/scope1/schema'
import { prompt } from '../../jobs/scope1/prompt'
import { queryTexts } from '../../jobs/scope1/queryTexts'

const followUpScope1 = new FollowUpWorker<FollowUpJob>(
  QUEUE_NAMES.FOLLOW_UP_SCOPE_1,
  async (job) => {
    const { url, previousAnswer } = job.data

    const answer = await job.followUp(
      url,
      previousAnswer,
      schema,
      prompt,
      queryTexts,
      FollowUpType.Scope1,
    )

    return answer
  },
)

export default followUpScope1
