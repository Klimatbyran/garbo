import config from '../config/chromadb'
import redis from '../config/redis'
import { PipelineWorker, PipelineJob } from '../lib/PipelineWorker'
import { vectorDB } from '../lib/vectordb'
import type { DoclingPageSnippet } from '../lib/doclingPageLookup'
import { QUEUE_NAMES } from '../queues'
import { fireCallback } from '../lib/webhook'
import { prisma } from '../lib/prisma'
import { buildReportMatchConditions } from '../api/services/registryReportIdentity'

class IndexMarkdownJob extends PipelineJob {
  declare data: PipelineJob['data'] & {
    markdown: string
    pageSnippets?: DoclingPageSnippet[]
    /** When set, POST {url} here instead of continuing into precheck. Must
     * match an entry in ALLOWED_CALLBACK_URLS. Set via parsePdf's same field. */
    callbackUrl?: string
  }
}

function pageSnippetsFromUnknown(value: unknown): DoclingPageSnippet[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const text = (item as { text?: unknown }).text
    const pageNumber = (item as { pageNumber?: unknown }).pageNumber
    const normalized = (item as { normalized?: unknown }).normalized
    if (typeof text !== 'string' || typeof pageNumber !== 'number') return []
    return [
      {
        text,
        pageNumber,
        normalized:
          typeof normalized === 'string' && normalized
            ? normalized
            : text.toLowerCase().replace(/\s+/g, ' ').trim(),
      },
    ]
  })
}

const indexMarkdown = new PipelineWorker(
  QUEUE_NAMES.INDEX_MARKDOWN,
  async (job: IndexMarkdownJob) => {
    const { url } = job.data

    // Accept markdown from own data or from child job results (e.g., Docling parser)
    const childEntries: Record<string, unknown> = await job
      .getChildrenEntries()
      .catch((): Record<string, unknown> => ({}))
    const childMarkdown =
      typeof childEntries.markdown === 'string'
        ? childEntries.markdown
        : undefined
    let markdown: string | undefined = job.data.markdown ?? childMarkdown
    const pageSnippets =
      job.data.pageSnippets ??
      pageSnippetsFromUnknown(childEntries.pageSnippets)

    // doclingParsePDF already persists markdown to the Report registry row
    // before this job ever runs -- its own returnvalue no longer carries the
    // full string (see doclingParsePDF.ts), so this is the normal path now,
    // not a rare fallback.
    if ((!markdown || !markdown.trim()) && url) {
      const matchConditions = buildReportMatchConditions({
        url,
        sourceUrl: url,
        s3Url: url,
      })
      const report = await prisma.report.findFirst({
        where: matchConditions.length > 0 ? { OR: matchConditions } : { url },
        select: { markdown: true },
      })
      markdown = report?.markdown ?? undefined
    }

    if (!markdown || !markdown.trim()) {
      job.editMessage(
        '❌ No markdown provided to index. Ensure the parser child returned markdown.'
      )
      throw new Error('IndexMarkdown: missing markdown')
    }

    await job.sendMessage(`🤖 Saving to vector database...`)
    job.log(
      'Indexing ' +
        Math.ceil(markdown.length / config.chunkSize) +
        ' chunks from url: ' +
        url
    )

    try {
      await vectorDB.addReport(
        url,
        markdown,
        (msg) => job.log(msg),
        pageSnippets
      )
      job.editMessage(`✅ Saving to vector database...`)
      job.log('Done!')

      const { callbackUrl } = job.data
      if (callbackUrl) {
        await fireCallback(callbackUrl, { url }, (msg) => job.log(msg))
      }

      // Not { url, markdown } -- every downstream consumer (precheck,
      // checkEmissionsPresence) now has its own Report-registry fallback,
      // so this job's own returnvalue doesn't need to carry the full
      // string just to survive in Redis until something reads it.
      return { url }
    } catch (error) {
      job.log('Error: ' + error)
      job.editMessage(
        `❌ An error occurred when attempting to access the vector database: ${error}`
      )
      throw error
    }
  },
  { concurrency: 1, connection: redis }
)

export default indexMarkdown
