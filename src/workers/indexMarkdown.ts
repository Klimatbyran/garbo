import { DiscordWorker, DiscordJob } from '../lib/DiscordWorker'
import { vectorDB } from '../lib/vectordb'

class JobData extends DiscordJob {}

const indexMarkdown = new DiscordWorker(
  'indexMarkdown',
  async (job: JobData) => {
    const { url } = job.data
    const childrenValues = await job.getChildrenEntries()
    const { markdown }: { markdown: string } = childrenValues

    const chunks = markdown
      .split('\n###')
      .map((p) => p.trim())
      .filter((p) => p.length > 0)

    await job.sendMessage(`🤖 Sparar i vektordatabas...`)
    job.log('Indexing ' + chunks.length + ' chunks from url: ' + url)

    try {
      await vectorDB.addReport(url, chunks)
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
