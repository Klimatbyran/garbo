import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { vectorDB } from '../lib/vectordb'
import { askStream } from '../lib/openai'
import { zodResponseFormat } from 'openai/helpers/zod'

export class VerifyCalculationsJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    suspectedErrors: Array<{
      type: string
      description: string
    }>
    emissionsData: any
  }
}

const verifyCalculations = new DiscordWorker<VerifyCalculationsJob>(
  'verifyCalculations',
  async (job) => {
    const { url, companyName, suspectedErrors, emissionsData } = job.data

    // Get relevant context about calculation methodologies
    const markdown = await vectorDB.getRelevantMarkdown(url, [
      'Emissions calculation methodology',
      'GHG accounting principles',
      'Emission factors used',
      'Calculation assumptions',
    ], 5)

    const response = await askStream(
      [
        {
          role: 'system',
          content: 'You are an expert in GHG emissions calculation methodologies.'
        },
        {
          role: 'user',
          content: `Verify the emissions calculations for ${companyName}.

Suspected errors:
${suspectedErrors && suspectedErrors.length > 0 
  ? suspectedErrors.map(err => `- ${err.type}: ${err.description}`).join('\n')
  : 'No specific errors identified, but general verification requested.'}

Current emissions data:
${JSON.stringify(emissionsData, null, 2)}

Context from report:
${markdown}

Analyze the calculation methods, conversion factors, and any potential errors. Provide specific recommendations for corrections if needed.`
        }
      ],
      {
        response_format: { type: 'text' }
      }
    )

    await job.sendMessage(`
🔢 Calculation Verification for ${companyName}:

${response}

Next steps:
1. Review the calculation analysis
2. Implement any recommended corrections
3. Update the emissions data if errors are confirmed
`)

    return { analysis: response }
  }
)

export default verifyCalculations
