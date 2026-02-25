import { vectorDB } from '../../lib/vectordb'
import { askStream } from '../../lib/openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { AssessmentInput, AssessmentResult } from './types'

export async function assessEmissions(
  input: AssessmentInput
): Promise<AssessmentResult> {
  const { url, companyName, reportingPeriods, industry } = input

  const {
    default: { schema, prompt, queryTexts },
  } = await import('../../prompts/followUp/emissionsAssessment')

  // Get relevant context from the PDF
  const markdown = await vectorDB.getRelevantMarkdown(url, queryTexts, 5)

  const contextData = {
    reportingPeriods,
    industry,
    extractedText: markdown,
  }

  const response = await askStream(
    [
      {
        role: 'system',
        content:
          'You are an expert in corporate emissions reporting and GHG Protocol standards. Respond with a JSON object containing your assessment.',
      },
      {
        role: 'user',
        content: `Here is the emissions data and context for ${companyName}:\n${JSON.stringify(contextData, null, 2)}\n\n${prompt}`,
      },
    ],
    {
      response_format: zodResponseFormat(schema, 'emissions-assessment'),
    }
  )

  const assessment = JSON.parse(response)
  return assessment
}
