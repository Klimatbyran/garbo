import config from '../config/chromadb'
import redis from '../config/redis'
import { PipelineWorker, PipelineJob } from '../lib/PipelineWorker'
import { vectorDB } from '../lib/vectordb'
import { QUEUE_NAMES } from '../queues'
import { fireCallback } from '../lib/webhook'

class IndexMarkdownJob extends PipelineJob {
  declare data: PipelineJob['data'] & {
    markdown: string
    /** When set, POST {url} here instead of continuing into precheck. Must
     * match an entry in ALLOWED_CALLBACK_URLS. Set via parsePdf's same field. */
    callbackUrl?: string
  }
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
    const markdown: string | undefined = job.data.markdown ?? childMarkdown

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
      await vectorDB.addReport(url, markdown, (msg) => job.log(msg))
      job.editMessage(`✅ Saving to vector database...`)
      job.log('Done!')

      const { callbackUrl } = job.data
      if (callbackUrl) {
        await fireCallback(callbackUrl, { url }, (msg) => job.log(msg))
      }

      return { url, markdown }
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
