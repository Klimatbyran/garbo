import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { vectorDB } from '../lib/vectordb'
import { askStream } from '../lib/openai'
import { zodResponseFormat } from 'openai/helpers/zod'

export class EstimateCategory4Job extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    industry: string
    scope12Data: any
    scope3Data: any
    economy: any
  }
}

const estimateCategory4 = new DiscordWorker<EstimateCategory4Job>(
  'estimateCategory4',
  async (job) => {
    const { url, companyName, industry, scope12Data, scope3Data, economy } =
      job.data

    const {
      default: { schema, prompt, queryTexts },
    } = await import('../prompts/scope3Categories/category4')

    // Get relevant context about transportation and distribution
    const markdown = await vectorDB.getRelevantMarkdown(url, queryTexts, 5)

    const contextData = {
      industry,
      scope12Data,
      scope3Data,
      economy,
      extractedText: markdown,
    }

    const response = await askStream(
      [
        {
          role: 'system',
          content:
            'You are an expert in Scope 3 Category 4 emissions calculation and transportation logistics analysis. Respond with a JSON object containing your analysis.',
        },
        {
          role: 'user',
          content: `Analyze Category 4 (Upstream Transportation and Distribution) emissions for ${companyName}:\n${JSON.stringify(
            contextData,
            null,
            2
          )}\n\n${prompt}`,
        },
      ],
      {
        response_format: { type: 'json_object' },
      }
    )

    const analysis = JSON.parse(response)

    await job.sendMessage(`
📊 Scope 3 Category 4 Analysis for ${companyName}:

Estimated emissions: ${analysis.analysis.estimatedEmissions.value} ${
      analysis.analysis.estimatedEmissions.unit
    }
Confidence: ${Math.round(
      analysis.analysis.estimatedEmissions.confidence * 100
    )}%

Reasoning: ${analysis.analysis.reasoning}

Methodology: ${analysis.analysis.methodology}

Key factors:
${analysis.analysis.relevantFactors
  .map((f) => `- ${f.name} (${f.impact} impact): ${f.value}`)
  .join('\n')}

Data gaps:
${analysis.analysis.dataGaps.map((gap) => `- ${gap}`).join('\n')}

Recommendations:
${analysis.analysis.recommendations.map((rec) => `- ${rec}`).join('\n')}
`)

    return analysis
  }
)

export default estimateCategory4
