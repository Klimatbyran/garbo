import request from 'supertest'
import express from 'express'
import companyRoutes from '../src/routes/companyRoutes'
import { PrismaClient } from '@prisma/client'

const app = express()
app.use(express.json())
app.use('/companies', companyRoutes)

const prisma = new PrismaClient()

describe('Company Routes Middlewares', () => {
  beforeAll(async () => {
    // Setup any necessary data or mocks
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  test('fakeAuth middleware should set user in res.locals', async () => {
    app.get('/test-auth', (req, res) => {
      res.json(res.locals.user)
    })

    const response = await request(app).get('/test-auth')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      id: 2,
      name: 'Alexandra Palmqvist',
      email: 'alex@klimatkollen.se',
    })
  })

  test('createMetadata middleware should set metadata in res.locals', async () => {
    app.post('/test-metadata', (req, res) => {
      res.json(res.locals.metadata)
    })

    const response = await request(app).post('/test-metadata').send({ url: 'http://example.com' })
    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      source: 'http://example.com',
      userId: 2,
      verifiedByUserId: 2,
    })
  })

  // Additional tests for reportingPeriod and ensureEmissionsExists middlewares can be added here
})
