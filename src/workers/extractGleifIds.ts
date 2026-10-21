import { PipelineJob, PipelineWorker } from '../lib/PipelineWorker'
import { QUEUE_NAMES, queues } from '../queues'
import { getGleifLinkedIdentifiers } from '../lib/gleif'
import { normalizeLei } from '../lib/normalizeLei'
import { withPipelineJobOpts } from '../lib/pipelineJobOptions'

export class GleifIdsJob extends PipelineJob {
  declare data: PipelineJob['data'] & {
    companyName: string
    companyId: string
    lei: string
    existingCompany?: {
      identifiers?: Array<{ type: string; value: string; role?: string | null }>
    }
  }
}

const extractGleifIds = new PipelineWorker<GleifIdsJob>(
  QUEUE_NAMES.EXTRACT_GLEIF_IDS,
  async (job: GleifIdsJob) => {
    const { companyName, companyId, lei } = job.data
    const normalizedLei = normalizeLei(lei)

    if (!normalizedLei) {
      job.log(
        `❌ Invalid LEI '${lei}' for GLEIF identifier lookup on '${companyName}'; skipping.`
      )
      return { companyId, lei: null, linked: null }
    }

    job.log(`Fetching GLEIF-linked identifiers for LEI ${normalizedLei}`)
    let linked
    try {
      linked = await getGleifLinkedIdentifiers(normalizedLei)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      job.log(`❌ GLEIF lookup failed: ${message}`)
      await job.sendMessage(
        `❌ Failed GLEIF identifier lookup for ${companyName} (LEI ${normalizedLei}): ${message}`
      )
      throw error
    }

    if (!linked) {
      job.log(`No GLEIF LEI record for ${normalizedLei}`)
      return { companyId, lei: normalizedLei, linked: null }
    }

    job.log(
      `GLEIF linked: isins=${linked.isins.length}/${linked.isinTotal} truncated=${linked.isinsTruncated} org=${linked.registeredAs ?? 'none'} bics=${JSON.stringify(linked.bics)} jurisdiction=${linked.jurisdiction}`
    )

    await queues.diffGleifIds.add(
      `${companyName} - GLEIF identifiers`,
      {
        ...job.data,
        lei: normalizedLei,
        linked,
      },
      withPipelineJobOpts({
        attempts: 3,
        ...(job.id
          ? { parent: { id: job.id, queue: job.queueName } }
          : undefined),
      })
    )

    return { companyId, lei: normalizedLei, linked }
  }
)

export default extractGleifIds
