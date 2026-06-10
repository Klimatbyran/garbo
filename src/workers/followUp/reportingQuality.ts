import { QUEUE_NAMES } from '../../queues'
import { FollowUpJob, FollowUpWorker } from '../../lib/FollowUpWorker'
import { FollowUpType } from '../../types'
import { reportingQualitySchema } from '../../jobs/reportingQuality/schema'
import { prompt } from '../../jobs/reportingQuality/prompt'
import { queryTexts } from '../../jobs/reportingQuality/queryTexts'

const followUpReportingQuality = new FollowUpWorker<FollowUpJob>(
  QUEUE_NAMES.FOLLOW_UP_REPORTING_QUALITY,
  async (job) => {
    const { url, previousAnswer } = job.data

    const answer = await job.followUp(
      url,
      previousAnswer,
      reportingQualitySchema,
      prompt,
      queryTexts,
      FollowUpType.ReportingQuality
    )

    return answer
  }
)

export default followUpReportingQuality
