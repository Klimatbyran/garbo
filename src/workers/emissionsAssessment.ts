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

    try {
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
          response_format: { type: 'json_object' }
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

      // Trigger follow-up workers based on assessment results
      if (assessment.assessment.nextSteps.some(step => step.type === 'REQUEST_SCOPE3')) {
        const missingCategories = assessment.assessment.issues
          .filter(issue => issue.type === 'SCOPE_MISSING')
          .map(issue => issue.description)
        
        await job.queue.add('verifyScope3', {
          ...job.data,
          scope3Data: contextData.scope3,
          missingCategories
        })
      }

      if (assessment.assessment.nextSteps.some(step => step.type === 'VERIFY_CALCULATION')) {
        const calculationIssues = assessment.assessment.issues
          .filter(issue => issue.type === 'CALCULATION_ERROR')
        
        await job.queue.add('verifyCalculations', {
          ...job.data,
          suspectedErrors: calculationIssues,
          emissionsData: {
            scope12: contextData.scope12,
            scope3: contextData.scope3,
            biogenic: contextData.biogenic
          }
        })
      }

      return assessment
    } catch (error) {
      job.log(`Error in emissions assessment: ${error.message}`)
      await job.sendMessage(`⚠️ Error assessing emissions data: ${error.message}`)
      throw error
    }
  }
)

export default emissionsAssessment
