import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { askStream } from '../lib/openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { vectorDB } from '../lib/vectordb'
import { QUEUE_NAMES } from '../queues'
import showNotes from '../prompts/followUp/showNotes'

export class GenerateShowNotesJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidata: { node: string }
    existingCompany: any
  }
}

const generateShowNotes = new DiscordWorker<GenerateShowNotesJob>(
  QUEUE_NAMES.GENERATE_SHOW_NOTES,
  async (job) => {
    const { url, companyName } = job.data

    job.sendMessage(`🎬 Generating climate news show notes for ${companyName}...`)

    try {
      // Get relevant content from the report
      const markdown = await vectorDB.getRelevantMarkdown(url, showNotes.queryTexts, 15)
      
      job.log(`Retrieved relevant content for show notes generation`)

      // Generate the show notes using OpenAI
      const response = await askStream(
        [
          {
            role: 'system',
            content: 'You are an expert climate journalist who creates concise, engaging scripts for climate news reports. Focus on the most significant findings from emissions reports with a slightly critical tone.'
          },
          {
            role: 'user',
            content: `Company: ${companyName}\n\nReport content:\n${markdown}\n\n${showNotes.prompt}`
          }
        ],
        {
          response_format: zodResponseFormat(showNotes.schema, 'show-notes')
        }
      )

      const parsedResponse = JSON.parse(response)
      job.log(`Generated show notes: ${JSON.stringify(parsedResponse)}`)

      // Format the show notes for display
      const formattedScript = parsedResponse.showNotes.script
        .replace(/\[\[pause (\d+\.\d+)s\]\]/g, '[[pause $1s]]')

      await job.sendMessage(`## ${parsedResponse.showNotes.title}\n\n\`\`\`\n${formattedScript}\n\`\`\``)
      
      job.editMessage(`✅ Climate news show notes generated for ${companyName}!`)

      // Trigger HeyGen video generation
      const { queue } = await import('../queues')
      await queue.generateHeygenVideo.add(`Generate video for ${companyName}`, {
        ...job.data,
        showNotes: parsedResponse.showNotes
      })

      return parsedResponse.showNotes
    } catch (error) {
      job.log(`Error generating show notes: ${error.message}`)
      job.editMessage(`❌ Failed to generate show notes: ${error.message}`)
      throw error
    }
  }
)

export default generateShowNotes
