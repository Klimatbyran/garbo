import { Options } from 'swagger-jsdoc'

export const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
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
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
            },
            details: {
              type: 'object',
              nullable: true,
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'], // Path to the API routes
}
