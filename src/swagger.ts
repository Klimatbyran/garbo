import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { registry } from './openapi/registry'

const generator = new OpenApiGeneratorV3(registry.definitions)

export const swaggerOptions = {
  definition: {
    ...generator.generateDocument({
      info: {
        title: 'Klimatkollen API',
        version: '1.0.0',
        description: `
![Klimatkollen Logo](https://beta.klimatkollen.se/klimatkollen_logo.svg)

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
* [API Terms of Service](https://klimatkollen.se/terms)
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
      },
      servers: [
        {
          url: '/api',
          description: 'API endpoint',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter your JWT token',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    }),
  },
  apis: ['./src/routes/**/*.ts', './src/routes/companies/*.ts'],
}
