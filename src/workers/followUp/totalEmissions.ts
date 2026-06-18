import { QUEUE_NAMES } from '../../queues'
import { FollowUpJob, FollowUpWorker } from '../../lib/FollowUpWorker'
import { FollowUpType } from '../../types'
import { schema } from '../../jobs/totalEmissions/schema'
import { prompt } from '../../jobs/totalEmissions/prompt'
import { queryTexts } from '../../jobs/totalEmissions/queryTexts'

const followUpTotalEmissions = new FollowUpWorker<FollowUpJob>(
  QUEUE_NAMES.FOLLOW_UP_TOTAL_EMISSIONS,
  async (job) => {
    const { url, previousAnswer } = job.data

    const answer = await job.followUp(
      url,
      previousAnswer,
      schema,
      prompt,
      queryTexts,
      FollowUpType.TotalEmissions
    )

    return answer
  }
)

export default followUpTotalEmissions
