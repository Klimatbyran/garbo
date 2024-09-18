import request from 'supertest'
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import {
  createMetadata,
  fakeAuth,
  reportingPeriod,
  validateReportingPeriod,
} from '../src/routes/middlewares'

const app = express()
app.use(express.json())

const prisma = new PrismaClient()

describe('Company Routes Middlewares', () => {
  beforeAll(async () => {
    execSync('npx prisma migrate reset --force --skip-seed')
    // Setup any necessary data or mocks
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  test('fakeAuth middleware should set user in res.locals', async () => {
    app.get('/companies', fakeAuth(), (req, res) => {
      res.json(res.locals.user)
    })

    const response = await request(app).get('/companies')
    if (response.status !== 200) {
      console.error('Error response:', response.body)
    }
    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      id: 2,
      name: 'Alexandra Palmqvist',
      email: 'alex@klimatkollen.se',
    })
  })

  test('createMetadata middleware should set metadata in res.locals', async () => {
    const prisma = jest.fn() as unknown as PrismaClient
    app.post(
      '/test-metadata',
      fakeAuth(),
      createMetadata(prisma),
      (req, res) => {
        res.json(res.locals.metadata)
      }
    )

    const response = await request(app)
      .post('/test-metadata')
      .send({ url: 'http://example.com' })
    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      source: 'http://example.com',
      userId: 2,
      verifiedByUserId: 2,
    })
  })

  test('reportingPeriod middleware should set period in res.locals', async () => {
    const testApp = express()
    testApp.use(express.json())
    testApp.get(
      '/test-reporting-period',
      validateReportingPeriod(),
      reportingPeriod(prisma),
      (req, res) => {
        res.json(res.locals.period)
      }
    )

    const response = await request(testApp).get('/test-reporting-period')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      startDate: expect.any(String),
      endDate: expect.any(String),
    })
  })
})
