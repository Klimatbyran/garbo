import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  OPENAPI_PREFIX: z.string().default('api'),
})

const env = envSchema.parse(process.env)

const openAPITags = {
  Companies: {
    description: 'Companies and related resources',
  },
  Industry: {
    description: 'Company industry',
  },
  Goals: {
    description: 'Company goals',
  },
  Industry: {
    description: 'Company industry',
  },
} as const

type TagName = keyof typeof openAPITags
type Tag = (typeof openAPITags)[TagName] & { name: TagName }

export default {
  prefix: env.OPENAPI_PREFIX,
  tags: Object.entries(openAPITags).reduce((tags, [name, tag]) => {
    const tagName = name as unknown as TagName
    tags[tagName] = { name: tagName, ...tag }
    return tags
  }, {} as Record<TagName, Tag>),
}
