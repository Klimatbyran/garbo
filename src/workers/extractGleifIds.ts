import { PipelineJob, PipelineWorker } from '../lib/PipelineWorker'
import { QUEUE_NAMES, queues } from '../queues'
import { getGleifLinkedIdentifiers } from '../lib/gleif'
import {
  processExtractGleifIds,
  type ExtractGleifJobLike,
} from './extractGleifIdsProcess'

export class GleifIdsJob extends PipelineJob {
  declare data: PipelineJob['data'] & {
    companyName: string
    companyId: string
    lei: string
    existingCompany?: {
      identifiers?: Array<{ type: string; value: string; role?: string | null }>
    }
    /** Set after diffGleifIds is enqueued as a child; skips re-fetch on resume. */
    gleifDiffEnqueued?: boolean
    linked?: Awaited<ReturnType<typeof getGleifLinkedIdentifiers>>
  }
}

const extractGleifIds = new PipelineWorker<GleifIdsJob>(
  QUEUE_NAMES.EXTRACT_GLEIF_IDS,
  async (job: GleifIdsJob, _logger, token?: string) =>
    processExtractGleifIds(job as unknown as ExtractGleifJobLike, token, {
      getLinked: getGleifLinkedIdentifiers,
      addDiff: (name, data, opts) =>
        queues.diffGleifIds.add(name, data as GleifIdsJob['data'], opts),
    })
)

export default extractGleifIds
export {
  gleifDiffChildJobOpts,
  processExtractGleifIds,
} from './extractGleifIdsProcess'
