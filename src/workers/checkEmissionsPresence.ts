import { PipelineWorker, PipelineJob } from '../lib/PipelineWorker'
import { QUEUE_NAMES } from '../queues'
import { detectEmissionsPresence } from '../lib/emissionsPresence'
import { prisma } from '../lib/prisma'
import { buildReportMatchConditions } from '../api/services/registryReportIdentity'
import precheck from './precheck'
import { withPipelineJobOpts } from '../lib/pipelineJobOptions'

class CheckEmissionsPresenceJob extends PipelineJob {
  declare data: PipelineJob['data'] & {
    markdown?: string
    cachedMarkdown?: string
    requireEmissionsPresence?: boolean
  }
}

async function resolveMarkdown(
  job: CheckEmissionsPresenceJob
): Promise<string | null> {
  if (typeof job.data.markdown === 'string' && job.data.markdown.trim()) {
    return job.data.markdown
  }
  if (
    typeof job.data.cachedMarkdown === 'string' &&
    job.data.cachedMarkdown.trim()
  ) {
    return job.data.cachedMarkdown
  }

  try {
    const childEntries = await job.getChildrenEntries()
    if (
      typeof childEntries.markdown === 'string' &&
      childEntries.markdown.trim()
    ) {
      return childEntries.markdown
    }
  } catch {
    // no children (e.g. cache-hit path enqueued this job directly)
  }

  const url = job.data.url
  if (!url) return null

  const matchConditions = buildReportMatchConditions({
    url,
    sourceUrl: url,
    s3Url: url,
  })
  const report = await prisma.report.findFirst({
    where: matchConditions.length > 0 ? { OR: matchConditions } : { url },
    select: { markdown: true },
  })
  return report?.markdown ?? null
}

async function persistPresenceResult(
  url: string,
  hasEmissionsMentions: boolean
): Promise<void> {
  const matchConditions = buildReportMatchConditions({
    url,
    sourceUrl: url,
    s3Url: url,
  })
  const report = await prisma.report.findFirst({
    where: matchConditions.length > 0 ? { OR: matchConditions } : { url },
    select: { id: true },
    orderBy: { id: 'asc' },
  })
  if (!report) {
    return
  }
  await prisma.report.update({
    where: { id: report.id },
    data: {
      hasEmissionsMentions,
      emissionsPresenceCheckedAt: new Date(),
    },
  })
}

const checkEmissionsPresence = new PipelineWorker(
  QUEUE_NAMES.CHECK_EMISSIONS_PRESENCE,
  async (job: CheckEmissionsPresenceJob) => {
    const { url } = job.data
    job.sendMessage('🔎 Checking report for Scope 1/2/3 mentions...')

    const markdown = await resolveMarkdown(job)
    if (!markdown || !markdown.trim()) {
      job.log('No markdown available for emissions presence check')
      job.editMessage(
        '⚠️ No markdown available — skipping emissions extraction (gated).'
      )
      try {
        await persistPresenceResult(url, false)
      } catch (err) {
        job.log(
          `Failed to persist emissions presence on Report: ${err instanceof Error ? err.message : String(err)}`
        )
      }
      return {
        gated: true,
        reason: 'no_markdown',
        hasEmissionsMentions: false,
        matchedTerms: [] as string[],
      }
    }

    const result = detectEmissionsPresence(markdown)
    job.log(
      result.hasEmissionsMentions
        ? `Emissions mentions found: ${result.matchedTerms.join(', ')}`
        : 'No Scope 1/2/3 mentions found in markdown'
    )

    try {
      await persistPresenceResult(url, result.hasEmissionsMentions)
    } catch (err) {
      job.log(
        `Failed to persist emissions presence on Report: ${err instanceof Error ? err.message : String(err)}`
      )
    }

    if (!result.hasEmissionsMentions) {
      job.editMessage(
        '⏭️ No Scope 1/2/3 mentions — skipping precheck and LLM extraction.'
      )
      return {
        gated: true,
        reason: 'no_emissions_mentions',
        hasEmissionsMentions: false,
        matchedTerms: result.matchedTerms,
      }
    }

    job.editMessage(
      `✅ Scope mentions found (${result.matchedTerms.join(', ')}). Continuing to precheck...`
    )

    const added = await precheck.queue.add(
      'precheck',
      {
        ...job.data,
        // Full markdown for company-name extraction when we came via the gate
        cachedMarkdown: markdown,
      },
      withPipelineJobOpts()
    )
    job.log(`Enqueued precheck job ${added.id}`)

    return {
      gated: false,
      hasEmissionsMentions: true,
      matchedTerms: result.matchedTerms,
      precheckJobId: added.id,
    }
  }
)

export default checkEmissionsPresence
