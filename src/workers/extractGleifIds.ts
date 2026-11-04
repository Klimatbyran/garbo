import { WaitingChildrenError } from 'bullmq'
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
    /** Set after diffGleifIds is enqueued as a child; skips re-fetch on resume. */
    gleifDiffEnqueued?: boolean
    linked?: Awaited<ReturnType<typeof getGleifLinkedIdentifiers>>
  }
}

const extractGleifIds = new PipelineWorker<GleifIdsJob>(
  QUEUE_NAMES.EXTRACT_GLEIF_IDS,
  async (job: GleifIdsJob, _logger, token?: string) => {
    const { companyName, companyId, lei } = job.data
    const normalizedLei = normalizeLei(lei)

    // Resumed after waiting for diffGleifIds children.
    if (job.data.gleifDiffEnqueued) {
      job.log('GLEIF diff child finished; completing extractGleifIds.')
      return {
        companyId,
        lei: normalizedLei,
        linked: job.data.linked ?? null,
      }
    }

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

    if (!job.id) {
      throw new Error('extractGleifIds job is missing id; cannot parent diffGleifIds')
    }

    // ParentOptions.queue must include the BullMQ prefix (queueQualifiedName).
    await queues.diffGleifIds.add(
      `${companyName} - GLEIF identifiers`,
      {
        ...job.data,
        lei: normalizedLei,
        linked,
      },
      withPipelineJobOpts({
        attempts: 3,
        // Keep sendCompanyLink moving if the GLEIF diff fails.
        failParentOnFailure: false,
        ignoreDependencyOnFailure: true,
        parent: {
          id: job.id,
          queue: job.queueQualifiedName,
        },
      })
    )

    await job.updateData({
      ...job.data,
      lei: normalizedLei,
      linked,
      gleifDiffEnqueued: true,
    })

    if (!token) {
      job.log(
        'No worker token available; cannot moveToWaitingChildren — completing without wait.'
      )
      return { companyId, lei: normalizedLei, linked }
    }

    const shouldWait = await job.moveToWaitingChildren(token)
    if (shouldWait) {
      throw new WaitingChildrenError()
    }

    return { companyId, lei: normalizedLei, linked }
  }
)

export default extractGleifIds
