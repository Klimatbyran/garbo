import 'dotenv/config'
import { descriptions } from 'wikibase-sdk/dist/src/helpers/simplify'
import { z } from 'zod'

const envSchema = z.object({
  OPENAPI_PREFIX: z.string(),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid initialization of OpenAPI environment variables:')
  console.error(parsedEnv.error.format())

  if (parsedEnv.error.errors.some((err) => err.path[0] === 'OPENAPI_PREFIX')) {
    console.error('OPENAPI_PREFIX must be a prefix in the form of a string.')
  }

  throw new Error('Invalid initialization of OpenAPI environment variables')
}

const openAPITagDefinitions = {
  Companies: {
    description: 'Companies and related resources',
  },
  CompanyDescription: {
    description: 'Description of a company',
  },
  Industry: {
    description: 'Company industry',
  },
  ReportingPeriods: {
    description:
      'Yearly periodised data primarily related to emissions and economy',
  },
  Emissions: {
    description: 'Emissions for a specific reporting period',
  },
  Goals: {
    description: 'Company goals',
  },
  Initiatives: {
    description: 'Company initiatives',
  },
  BaseYear: {
    description: 'First year of comparable data',
  },
  Municipalities: {
    description: 'Climate data related to Swedish municipalities',
  },
  Regions: {
    description: 'Climate data related to Swedish regions',
  },
  Nation: {
    description: 'Climate data related to Sweden as a nation',
  },
  Auth: {
    descriptions: 'Authentification',
  },
  ReportValidations: {
    description: 'Report validations',
  },
  Screenshots: {
    description: 'Screenshots of PDF tables from reports',
  },
  Newsletters: {
    description: 'Newsletters',
  },
  TopLists: {
    description: 'Top ranked entities by various KPIs',
  },
} as const

type TagName = keyof typeof openAPITagDefinitions
type Tag = (typeof openAPITagDefinitions)[TagName] & { name: TagName }

const openAPITags = Object.entries(openAPITagDefinitions).reduce(
  (tags, [name, tag]) => {
    const tagName = name as unknown as TagName
    tags[tagName] = { name: tagName, ...tag }
    return tags
  },
  {} as Record<TagName, Tag>,
)

/**
 * Format valid OpenAPI tags as an array.
 */
export function getTags(...tags: (keyof typeof openAPITags)[]) {
  return tags
}

const env = parsedEnv.data

export default {
  prefix: env.OPENAPI_PREFIX,
  tags: openAPITags,

  title: 'Klimatkollen API Reference',
  description: `
The Klimatkollen API provides access to company emissions and economic data. This API allows you to retrieve, create and update information about companies' environmental impact and sustainability initiatives.

## Getting Started

To use the API, you'll need to:

1. Request an API key by contacting our team
2. Include your API key in the Authorization header:
\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Authentication

All endpoints require authentication using a Bearer token. Include your API key in the Authorization header of each request.

## Rate Limiting

- 1000 requests per hour for authenticated users
- 100 requests per hour for unauthenticated users

## Resources

* [Klimatkollen Website](https://klimatkollen.se)
* [Contact Support](mailto:support@klimatkollen.se)

## Examples

### Fetch Company Data

\`\`\`bash
curl -X GET "https://api.klimatkollen.se/api/companies/Q123" \\
     -H "Authorization: Bearer YOUR_API_KEY"
\`\`\`

### Update Company Emissions

\`\`\`bash
curl -X POST "https://api.klimatkollen.se/api/companies/Q123/reporting-periods" \\
     -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     -d '{"reportingPeriods": [...]}'
\`\`\`
`,
}
