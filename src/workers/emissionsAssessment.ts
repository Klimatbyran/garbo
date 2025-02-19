import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { vectorDB } from '../lib/vectordb'
import { askStream } from '../lib/openai'
import { zodResponseFormat } from 'openai/helpers/zod'

export class EmissionsAssessmentJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    existingCompany: any
    wikidata: { node: string }
    scope12?: any[]
    scope3?: any[]
    biogenic?: any[]
    industry?: any
  }
}

const emissionsAssessment = new DiscordWorker<EmissionsAssessmentJob>(
  'emissionsAssessment',
  async (job) => {
    const { url, companyName, scope12, scope3, biogenic, industry } = job.data

    const {
      default: { schema, prompt, queryTexts },
    } = await import('../prompts/followUp/emissionsAssessment')

    // Get relevant context from the PDF
    const markdown = await vectorDB.getRelevantMarkdown(url, queryTexts, 5)

    job.log(`Assessing emissions data for ${companyName}`)
    
    const contextData = {
      scope12,
      scope3,
      biogenic,
      industry,
      extractedText: markdown
    }

    const response = await askStream(
      [
        {
          role: 'system',
          content: 'You are an expert in corporate emissions reporting and GHG Protocol standards.'
        },
        {
          role: 'user',
          content: `Here is the emissions data and context for ${companyName}:\n${JSON.stringify(contextData, null, 2)}\n\n${prompt}`
        }
      ],
      {
        response_format: zodResponseFormat(schema, 'emissions-assessment')
      }
    )

    job.log('Assessment response: ' + response)

    const assessment = JSON.parse(response)

    // Send a summary message to Discord
    await job.sendMessage(`
🔍 Emissions Assessment for ${companyName}:
${assessment.assessment.isReasonable ? '✅' : '⚠️'} Data appears ${assessment.assessment.isReasonable ? 'reasonable' : 'problematic'} (${Math.round(assessment.assessment.confidence * 100)}% confidence)

${assessment.assessment.issues.length > 0 ? `Issues found:
${assessment.assessment.issues.map(i => `- ${i.severity} severity: ${i.description}`).join('\n')}` : 'No issues found.'}

Reasoning: ${assessment.assessment.reasoning}

Next steps:
${assessment.assessment.nextSteps.map(s => `- [${s.priority}] ${s.description}`).join('\n')}
`)

    return assessment
  }
)

export default emissionsAssessment
