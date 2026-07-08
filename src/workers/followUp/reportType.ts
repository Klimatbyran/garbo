import { QUEUE_NAMES } from '../../queues'
import { FollowUpJob, FollowUpWorker } from '../../lib/FollowUpWorker'
import { z } from 'zod'
import { FollowUpType } from '../../types'
import { apiFetch } from '../../lib/api'

const queryTexts = [
  'Report type',
  'Sustainability report',
  'Annual report',
  'Integrated report',
  'CSR report',
  'Climate report',
  'ESG report',
  'Document title',
  'Table of contents',
]

async function fetchReportTypes(): Promise<
  { slug: string; label: string | null }[]
> {
  const options = await apiFetch('/report-types')
  if (!Array.isArray(options)) return []
  return options.map((o: { slug?: string | null; label?: string | null }) => ({
    slug: o.slug ?? '',
    label: o.label ?? null,
  }))
}

async function buildSchemaAndPrompt(): Promise<{
  hasOptions: boolean
  schema: z.ZodTypeAny
  prompt: string
}> {
  const reportTypes = await fetchReportTypes()
  const slugs = reportTypes.map((o) => o.slug).filter(Boolean)
  if (slugs.length === 0) {
    return {
      hasOptions: false,
      schema: z.object({ reportType: z.string().nullable() }),
      prompt: `No report types are configured. Return {"reportType": null}.`,
    }
  }
  const schema = z.object({
    reportType: z.enum(slugs as [string, ...string[]]).nullable(),
  })
  const typeList = reportTypes
    .map((o) => `- ${o.slug}${o.label ? ': ' + o.label : ''}`)
    .join('\n')
  const prompt = `
Analyze the report document and determine which report type best describes it. Only use one of these specific types:

${typeList}

Return the report type in JSON format like this:
{
  "reportType": "sustainability-report"
}

Only use the exact slugs listed above. Do not add any other values.
Do not include explanatory text, only return the JSON.
If you cannot determine the report type with certainty, return null for reportType.
`
  return { hasOptions: true, schema, prompt }
}

const reportType = new FollowUpWorker<FollowUpJob>(
  QUEUE_NAMES.FOLLOW_UP_REPORT_TYPE,
  async (job) => {
    const { url, previousAnswer } = job.data
    const { hasOptions, schema, prompt } = await buildSchemaAndPrompt()

    if (!hasOptions) {
      return { reportType: null }
    }

    const answer = await job.followUp(
      url,
      previousAnswer,
      schema,
      prompt,
      queryTexts,
      FollowUpType.ReportType
    )
    return answer
  }
)

export default reportType
