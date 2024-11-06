import { ChromaClient } from 'chromadb'
import chromadb from '../config/chromadb'
import { DiscordWorker, DiscordJob } from '../lib/DiscordWorker'

class JobData extends DiscordJob {}

const indexMarkdown = new DiscordWorker(
  'indexMarkdown',
  async (job: JobData) => {
    const client = new ChromaClient(chromadb)
    const { url } = job.data
    const childrenValues = await job.getChildrenEntries()
    const children = await job.getChildrenValues()
    console.log('childrenValues', childrenValues, children)
    const { markdown } = childrenValues
    const paragraphs = markdown
      .split('\n###')
      .map((p) => p.trim())
      .filter((p) => p.length > 0)

    await job.sendMessage(`🤖 Sparar i vektordatabas...`)
    job.log('Indexing ' + paragraphs.length + ' paragraphs from url: ' + url)
    try {
      const collection = await client.getOrCreateCollection({
        name: 'emission_reports',
        embeddingFunction: job.embedder,
      })
      job.log('Indexing ' + paragraphs.length + ' paragraphs...')
      const ids = paragraphs.map((p, i) => job.data.url + '#' + i)
      const metadatas = paragraphs.map((p, i) => ({
        source: url,
        markdown,
        type: 'company_sustainability_report', // this is our own type to be able to filter in the future if needed
        parsed: new Date().toISOString(),
        page: i,
      }))
      await collection.add({
        ids,
        metadatas,
        documents: paragraphs,
      })
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
