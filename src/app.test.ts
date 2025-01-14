import { afterAll, beforeAll, describe, it, expect } from 'vitest'
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import { PrismaClient } from '@prisma/client'
import { FastifyInstance } from 'fastify'

import startApp from './app'

describe('App', () => {
  let postgresContainer: StartedPostgreSqlContainer
  let db: PrismaClient
  let app: FastifyInstance

  beforeAll(async () => {
    postgresContainer = await new PostgreSqlContainer().start()
    db = new PrismaClient({
      datasourceUrl: postgresContainer.getConnectionUri(),
    })

    // TODO: apply migrations and seeding

    // IDEA: Maybe we want to inject the DB when creating the app so we can use the same instance everywhere?

    // Alternatively, find a way to get all the prisma clients to use the correct implementation.
    // IDEA: Maybe we could use a mock to override the DB connection URL for the lib/prisma.ts module?
    // That way, we might be able to control the DB connection from within the tests, without changing other code or config
    // As long as we use the lib/prisma.ts singleton everywhere in the app, we should then be able to write integration tests

    app = await startApp()
  })

  afterAll(async () => {
    await db?.$disconnect()
    await postgresContainer?.stop()
  })

  it('starts correctly', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api',
    })

    expect(response.statusCode).toBe(200)
    // TODO: Make sure the app publishes the api documentation
    // TODO: Make sure reading companies returns an empty list since no companies exists
  })
})
