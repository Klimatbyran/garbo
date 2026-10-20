import { PipelineJob, PipelineWorker } from '../lib/PipelineWorker'
import { QUEUE_NAMES, queues } from '../queues'
import { getIsinsForLei } from '../lib/gleif'
import { selectUniqueIsinForAutoWrite } from '../lib/isinOwnership'
import { normalizeLei } from '../lib/normalizeLei'
import { withPipelineJobOpts } from '../lib/pipelineJobOptions'

export class ISINJob extends PipelineJob {
  declare data: PipelineJob['data'] & {
    companyName: string
    companyId: string
    lei: string
    existingCompany?: {
      identifiers?: Array<{ type: string; value: string }>
    }
  }
}

const extractISIN = new PipelineWorker<ISINJob>(
  QUEUE_NAMES.EXTRACT_ISIN,
  async (job: ISINJob) => {
    const { companyName, companyId, lei } = job.data
    const normalizedLei = normalizeLei(lei)

    if (!normalizedLei) {
      job.log(
        `❌ Invalid LEI '${lei}' for ISIN lookup on '${companyName}'; skipping.`
      )
      return {
        isin: null,
        candidates: [] as string[],
        lei: null,
        companyId,
        reason: 'Invalid LEI',
      }
    }

    job.log(`Looking up ISINs in GLEIF for LEI ${normalizedLei}`)
    let candidates: string[]
    try {
      candidates = await getIsinsForLei(normalizedLei)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      job.log(`❌ GLEIF ISIN lookup failed: ${message}`)
      await job.sendMessage(
        `❌ Failed to look up ISIN for ${companyName} (LEI ${normalizedLei}): ${message}`
      )
      throw error
    }

    job.log(
      `GLEIF returned ${candidates.length} ISIN(s) for ${normalizedLei}: ${JSON.stringify(candidates)}`
    )

    const selected = selectUniqueIsinForAutoWrite(candidates)
    job.log(selected.reason)

    if (!selected.isin) {
      if (candidates.length > 1) {
        await job.sendMessage(
          `ℹ️ ${companyName}: ${candidates.length} ISINs linked to LEI ${normalizedLei}; left blank for staff (${candidates.join(', ')})`
        )
      }
      return {
        isin: null,
        candidates,
        lei: normalizedLei,
        companyId,
        reason: selected.reason,
      }
    }

    await queues.diffISIN.add(
      `${companyName} - ISIN`,
      {
        ...job.data,
        lei: normalizedLei,
        isin: selected.isin,
        candidates,
      },
      withPipelineJobOpts({
        attempts: 3,
        ...(job.id
          ? { parent: { id: job.id, queue: job.queueName } }
          : undefined),
      })
    )

    job.log(
      `✅ Enqueued diffISIN for '${companyName}' with ISIN '${selected.isin}'.`
    )

    return {
      isin: selected.isin,
      candidates,
      lei: normalizedLei,
      companyId,
      reason: selected.reason,
    }
  }
)

export default extractISIN
