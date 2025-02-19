import { DiscordJob, DiscordWorker } from '../../lib/DiscordWorker'
import { vectorDB } from '../../lib/vectordb'
import { askStream } from '../../lib/openai'
import { zodResponseFormat } from 'openai/helpers/zod'

export class EstimateCategory2Job extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    industry: string
    scope12Data: any
    scope3Data: any
    economy: any
  }
}

const estimateCategory2 = new DiscordWorker<EstimateCategory2Job>(
  'estimateCategory2',
  async (job) => {
    const { url, companyName, industry, scope12Data, scope3Data, economy } = job.data

    const {
      default: { schema, prompt, queryTexts },
    } = await import('../../prompts/scope3Categories/category2')

    // Get relevant context about capital goods and investments
    const markdown = await vectorDB.getRelevantMarkdown(url, queryTexts, 5)

    const contextData = {
      industry,
      scope12Data,
      scope3Data,
      economy,
      extractedText: markdown
    }

    const response = await askStream(
      [
        {
          role: 'system',
          content: 'You are an expert in Scope 3 Category 2 emissions calculation and capital goods analysis.'
        },
        {
          role: 'user',
          content: `Analyze Category 2 (Capital Goods) emissions for ${companyName}:\n${JSON.stringify(contextData, null, 2)}\n\n${prompt}`
        }
      ],
      {
        response_format: zodResponseFormat(schema, 'scope3-category2')
      }
    )

    const analysis = JSON.parse(response)

    await job.sendMessage(`
📊 Scope 3 Category 2 Analysis for ${companyName}:

Estimated emissions: ${analysis.analysis.estimatedEmissions.value} ${analysis.analysis.estimatedEmissions.unit}
Confidence: ${Math.round(analysis.analysis.estimatedEmissions.confidence * 100)}%

Reasoning: ${analysis.analysis.reasoning}

Methodology: ${analysis.analysis.methodology}

Key factors:
${analysis.analysis.relevantFactors.map(f => `- ${f.name} (${f.impact} impact): ${f.value}`).join('\n')}

Data gaps:
${analysis.analysis.dataGaps.map(gap => `- ${gap}`).join('\n')}

Recommendations:
${analysis.analysis.recommendations.map(rec => `- ${rec}`).join('\n')}
`)

    return analysis
  }
)

export default estimateCategory2
