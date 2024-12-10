import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { registry } from './openapi/registry'

const generator = new OpenApiGeneratorV3(registry.definitions)

export const swaggerOptions = {
  definition: {
    ...generator.generateDocument({
      info: {
        title: 'Klimatkollen API',
        version: '1.0.0',
        description: 'API for managing company emissions and economic data',
      },
      servers: [
        {
          url: '/api',
          description: 'API endpoint',
        },
      ],
    }),
  },
  apis: [
    './src/routes/**/*.ts',
    './src/routes/companies/*.ts'
  ]
}
