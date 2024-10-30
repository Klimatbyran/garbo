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
    //execSync('npx prisma migrate reset --force --skip-seed')
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

  test('reportingPeriod middleware should set reportingPeriod in res.locals', async () => {
    const testApp = express()
    testApp.use(express.json())
    testApp.post(
      '/:wikidataId/:year',
      fakeAuth(),
      validateReportingPeriod(),
      reportingPeriod(prisma),
      (req, res) => {
        res.json(res.locals.reportingPeriod)
      }
    )

    // Mock the Prisma client methods
    jest.spyOn(prisma.company, 'findFirst').mockResolvedValue({
      name: 'Test Company',
      wikidataId: 'Q1234',
      description: 'Test Company Description',
      url: 'http://testcompany.com',
      internalComment: 'No comments',
    })

    jest.spyOn(prisma.reportingPeriod, 'findFirst').mockResolvedValue(null)

    jest.spyOn(prisma.reportingPeriod, 'create').mockResolvedValue({
      id: 1,
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      reportURL: null,
      companyId: 'Q1234',
      emissionsId: 1,
      economyId: 1,
      metadataId: 1,
    })

    const response = await request(testApp).post('/Q1234/2023').send({
      startDate: '2023-01-01',
      endDate: '2023-12-31',
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      id: 1,
      economyId: 1,
      emissionsId: 1,
      metadataId: 1,
      startDate: '2023-01-01T00:00:00.000Z',
      endDate: '2023-12-31T00:00:00.000Z',
      reportURL: null,
      companyId: 'Q1234',
    })
  })

  test('reportingPeriod middleware should also work on sub routes', async () => {
    const testApp = express()
    testApp.use(express.json())
    testApp.use(
      '/:wikidataId/:year',
      fakeAuth(),
      validateReportingPeriod(),
      reportingPeriod(prisma),
      (req, res) => {
        res.json(res.locals.reportingPeriod)
      }
    )

    // Mock the Prisma client methods
    jest.spyOn(prisma.company, 'findFirst').mockResolvedValue({
      name: 'Test Company',
      wikidataId: 'Q1234',
      description: 'Test Company Description',
      url: 'http://testcompany.com',
      internalComment: 'No comments',
    })

    jest.spyOn(prisma.reportingPeriod, 'findFirst').mockResolvedValue(null)

    jest.spyOn(prisma.reportingPeriod, 'create').mockResolvedValue({
      id: 1,
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      reportURL: null,
      companyId: 'Q1234',
      emissionsId: 1,
      economyId: 1,
      metadataId: 1,
    })

    const response = await request(testApp).post('/Q1234/2023/emissions').send({
      startDate: '2023-01-01',
      endDate: '2023-12-31',
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      id: 1,
      economyId: 1,
      emissionsId: 1,
      metadataId: 1,
      startDate: '2023-01-01T00:00:00.000Z',
      endDate: '2023-12-31T00:00:00.000Z',
      reportURL: null,
      companyId: 'Q1234',
    })
  })
})
