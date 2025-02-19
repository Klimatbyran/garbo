import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { vectorDB } from '../lib/vectordb'
import { askStream } from '../lib/openai'
import { zodResponseFormat } from 'openai/helpers/zod'

export class NaceIndustryJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    description: string
  }
}

const naceIndustry = new DiscordWorker<NaceIndustryJob>(
  'naceIndustry',
  async (job) => {
    const { url, companyName, description } = job.data

    const {
      default: { schema, prompt, queryTexts },
    } = await import('../prompts/followUp/naceIndustry')

    // Get relevant context about company's business activities
    const markdown = await vectorDB.getRelevantMarkdown(url, queryTexts, 5)

    const contextData = {
      companyName,
      description,
      extractedText: markdown
    }

    const response = await askStream(
      [
        {
          role: 'system',
          content: 'You are an expert in NACE industry classification.'
        },
        {
          role: 'user',
          content: `Analyze and determine the NACE code for ${companyName}:\n${JSON.stringify(contextData, null, 2)}\n\n${prompt}`
        }
      ],
      {
        response_format: zodResponseFormat(schema, 'nace-industry')
      }
    )

    const analysis = JSON.parse(response)

    await job.sendMessage(`
🏢 NACE Classification for ${companyName}:

Code: ${analysis.nace.code}
Description: ${analysis.nace.description}
`)

    return analysis
  }
)

export default naceIndustry
