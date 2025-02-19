import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { vectorDB } from '../lib/vectordb'
import { askStream } from '../lib/openai'
import { zodResponseFormat } from 'openai/helpers/zod'

export class VerifyScope3Job extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    industry: string
    scope3Data: any
    missingCategories: string[]
  }
}

const verifyScope3 = new DiscordWorker<VerifyScope3Job>(
  'verifyScope3',
  async (job) => {
    const { url, companyName, industry, scope3Data, missingCategories } = job.data

    // Get relevant context about scope 3 from the PDF
    const markdown = await vectorDB.getRelevantMarkdown(url, [
      'Scope 3 emissions',
      'Value chain emissions',
      'Indirect emissions',
      ...missingCategories.map(cat => `Scope 3 category ${cat}`),
    ], 5)

    const response = await askStream(
      [
        {
          role: 'system',
          content: 'You are an expert in GHG Protocol Scope 3 reporting requirements.'
        },
        {
          role: 'user',
          content: `Analyze the scope 3 reporting for ${companyName} (${industry}). 
          
Current scope 3 data:
${JSON.stringify(scope3Data, null, 2)}

Missing categories: ${missingCategories.join(', ')}

Context from report:
${markdown}

Provide a detailed analysis of why these categories are missing and if they should be material for this type of company.`
        }
      ],
      {
        response_format: { type: 'text' }
      }
    )

    await job.sendMessage(`
🔍 Scope 3 Analysis for ${companyName}:

${response}

Next steps:
1. Review the analysis above
2. Consider requesting additional information for material missing categories
3. Update the scope 3 data if new information is found
`)

    return { analysis: response }
  }
)

export default verifyScope3
