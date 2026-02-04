import { QUEUE_NAMES } from "../../queues"
import { FollowUpJob, FollowUpWorker } from "../../lib/FollowUpWorker"
import { FollowUpType } from "../../types"
import { schema } from "../../jobs/scope2/schema"
import { prompt } from "../../jobs/scope2/prompt"
import { queryTexts } from "../../jobs/scope2/queryTexts"

const followUpScope2 = new FollowUpWorker<FollowUpJob>(
  QUEUE_NAMES.FOLLOW_UP_SCOPE_2,
  async (job) => {
    const { url, previousAnswer } = job.data

    const answer = await job.followUp(
      url,
      previousAnswer,
      schema,
      prompt  ,
      queryTexts,
      FollowUpType.Scope2,
    )

    return answer
  }
)

export default followUpScope2
