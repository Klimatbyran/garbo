import config from '../config/chromadb'
import { DiscordWorker, DiscordJob } from '../lib/DiscordWorker'
import { vectorDB } from '../lib/vectordb'
import { QUEUE_NAMES } from '../queues'

class IndexMarkdownJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    markdown: string
  }
}

const indexMarkdown = new DiscordWorker(
  QUEUE_NAMES.INDEX_MARKDOWN,
  async (job: IndexMarkdownJob) => {
    const { url, markdown } = job.data

    if (!markdown) {
      const errorMsg = 'No markdown content provided to index'
      job.log('Error: ' + errorMsg)
      job.editMessage(`❌ ${errorMsg}`)
      throw new Error(errorMsg)
    }

    await job.sendMessage(`🤖 Saving to vector database...`)
    job.log(
      'Indexing ' +
        Math.ceil(markdown.length / config.chunkSize) +
        ' chunks from url: ' +
        url,
    )

    try {
      await vectorDB.addReport(url, markdown)
      job.editMessage(`✅ Saving to vector database...`)
      job.log('Done!')

      return { markdown }
    } catch (error) {
      job.log('Error: ' + error)
      job.editMessage(
        `❌ An error occurred when attempting to access the vector database: ${error}`,
      )
      throw error
    }
  },
)

export default indexMarkdown
