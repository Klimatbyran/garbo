import { QUEUE_NAMES } from "../../queues";
import { FollowUpJob, FollowUpWorker } from "../../lib/FollowUpWorker";
import { FollowUpType } from "../../types";
import { schema } from "../../jobs/scope12/schema";
import { prompt } from "../../jobs/scope12/prompt";
import { queryTexts } from "../../jobs/scope12/queryTexts";

const followUpScope12 = new FollowUpWorker<FollowUpJob>(
  QUEUE_NAMES.FOLLOW_UP_SCOPE_12,
  async (job) => {
    const { url, previousAnswer } = job.data;
    const answer = await job.followUp(
      url,
      previousAnswer,
      schema,
      prompt,
      queryTexts,
      FollowUpType.Scope12,
    );
    return answer;
  }
);

export default followUpScope12;
