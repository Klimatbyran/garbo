import { DiscordWorker, DiscordJob } from '../lib/DiscordWorker'
import { vectorDB } from '../lib/vectordb'

class JobData extends DiscordJob {}

const indexMarkdown = new DiscordWorker(
  'indexMarkdown',
  async (job: JobData) => {
    const { url } = job.data
    const childrenValues = await job.getChildrenEntries()
    const { markdown }: { markdown: string } = childrenValues

    const chunkSize = 1000
    const overlapSize = 200

    const paragraphs: string[] = []
    for (let i = 0; i < markdown.length; i += chunkSize - overlapSize) {
      const chunk = markdown.slice(i, i + chunkSize)
      paragraphs.push(chunk.trim())
    }

    await job.sendMessage(`🤖 Sparar i vektordatabas...`)
    job.log('Indexing ' + paragraphs.length + ' paragraphs from url: ' + url)

    try {
      await vectorDB.addReport(url, markdown, paragraphs)
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
