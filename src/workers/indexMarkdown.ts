import { CHUNK_SIZE } from '../config'
import { DiscordWorker, DiscordJob } from '../lib/DiscordWorker'
import { vectorDB } from '../lib/vectordb'

class IndexMarkdownJob extends DiscordJob {}

const indexMarkdown = new DiscordWorker(
  'indexMarkdown',
  async (job: IndexMarkdownJob) => {
    const { url } = job.data
    const childrenValues = await job.getChildrenEntries()
    const { markdown }: { markdown: string } = childrenValues

    await job.sendMessage(`🤖 Sparar i vektordatabas...`)
    job.log(
      'Indexing ' +
        Math.ceil(markdown.length / CHUNK_SIZE) +
        ' chunks from url: ' +
        url
    )

    try {
      await vectorDB.addReport(url, markdown)
      job.editMessage(`✅ Sparad i vektordatabasen`)
      job.log('Done!')

      return { markdown }
    } catch (error) {
      job.log('Error: ' + error)
      job.editMessage(
        `❌ Ett fel uppstod när vektordatabasen skulle nås: ${error}`
      )
      throw error
    }
  }
)

export default indexMarkdown
