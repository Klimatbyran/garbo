import config from '../config/chromadb'
import { DiscordWorker, DiscordJob } from '../lib/DiscordWorker'
import { vectorDB } from '../lib/vectordb'
import { QUEUE_NAMES } from '../queues'

class IndexMarkdownJob extends DiscordJob {}

const indexMarkdown = new DiscordWorker(
  QUEUE_NAMES.INDEX_MARKDOWN,
  async (job: IndexMarkdownJob) => {
    const { url } = job.data
    const childrenValues = await job.getChildrenEntries()
    const { markdown }: { markdown: string } = childrenValues

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
