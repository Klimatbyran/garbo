import { QUEUE_NAMES } from '../../queues'
import { FollowUpJob, FollowUpWorker } from '../../lib/FollowUpWorker'
import { z } from 'zod'
import { FollowUpType } from '../../types'
import { apiFetch } from '../../lib/api'

const queryTexts = [
  'Company ownership structure',
  'Stock exchange listing',
  'Market cap',
  'Government ownership',
  'Municipal ownership',
  'Company type',
  'Corporate structure',
]

/** Fetches tag options from the API (no DB access in worker). */
async function fetchTagOptions(): Promise<
  { slug: string; label: string | null }[]
> {
  const options = await apiFetch('/tag-options')
  if (!Array.isArray(options)) return []
  return options.map((o: any) => ({
    slug: o.slug ?? '',
    label: o.label ?? null,
  }))
}

async function buildSchemaAndPrompt(): Promise<{
  hasOptions: boolean
  schema: z.ZodTypeAny
  prompt: string
}> {
  const tagOptions = await fetchTagOptions()
  const slugs = tagOptions.map((o) => o.slug).filter(Boolean)
  if (slugs.length === 0) {
    return {
      hasOptions: false,
      schema: z.object({ tags: z.array(z.string()) }),
      prompt: `No tag options are configured. Return {"tags": []}.`,
    }
  }
  const schema = z.object({
    tags: z.array(z.enum(slugs as [string, ...string[]])),
  })
  const tagList = tagOptions
    .map((o) => `- ${o.slug}${o.label ? ': ' + o.label : ''}`)
    .join('\n')
  const prompt = `
Analyze the company information and determine which tags apply. Only use these specific tags:

${tagList}

A company can have multiple tags if applicable (e.g. both 'public' and 'large-cap').

Return the tags in JSON format like this:
{
  "tags": ["tag1", "tag2"]
}

Only use the exact tags listed above. Do not add any other tags.
Do not include explanatory text, only return the JSON.
If you cannot determine any tags with certainty, return an empty array.
`
  return { hasOptions: true, schema, prompt }
}

const companyTags = new FollowUpWorker<FollowUpJob>(
  QUEUE_NAMES.FOLLOW_UP_COMPANY_TAGS,
  async (job) => {
    const { url, previousAnswer } = job.data
    const { hasOptions, schema, prompt } = await buildSchemaAndPrompt()

    // If no tag options are configured, don't attempt extraction.
    // Otherwise the model may hallucinate tags that the API will reject.
    if (!hasOptions) {
      return { tags: [] }
    }

    const answer = await job.followUp(
      url,
      previousAnswer,
      schema,
      prompt,
      queryTexts,
      FollowUpType.CompanyTags
    )
    return answer
  }
)

export default companyTags
