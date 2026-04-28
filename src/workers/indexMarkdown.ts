import config from '../config/chromadb'
import { DiscordWorker, DiscordJob } from '../lib/DiscordWorker'
import { vectorDB } from '../lib/vectordb'
import { QUEUE_NAMES } from '../queues'
import { fireCallback } from '../lib/webhook'

class IndexMarkdownJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    markdown: string
    callbackUrl?: string
  }
}

const indexMarkdown = new DiscordWorker<IndexMarkdownJob>(
  QUEUE_NAMES.INDEX_MARKDOWN,
  async (job) => {
    const { url } = job.data

    // Accept markdown from own data or from child job results (e.g., Docling parser)
    const childEntries = await job.getChildrenEntries().catch(() => ({}))
    const markdown: string | undefined =
      job.data.markdown ?? childEntries.markdown

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
      await vectorDB.addReport(url, markdown)
      job.editMessage(`✅ Saving to vector database...`)
      job.log('Done!')

      const { callbackUrl } = job.data
      if (callbackUrl) {
        await fireCallback(callbackUrl, { url }, (msg) => job.log(msg))
      }

      return { markdown }
    } catch (error) {
      job.log('Error: ' + error)
      job.editMessage(
        `❌ An error occurred when attempting to access the vector database: ${error}`
      )
      throw error
    }
  }
)

export default indexMarkdown
