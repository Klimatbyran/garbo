import { jest } from '@jest/globals'

const prismaMock = {
  user: {
    upsert: jest.fn<() => Promise<unknown>>(),
  },
}

jest.unstable_mockModule('../src/lib/prisma', () => ({
  prisma: prismaMock,
}))

const { getOrCreateServiceBotUser, GARBO_SERVICE_CLIENT_ID } = await import(
  '../src/api/services/serviceBotUser'
)

describe('serviceBotUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('upserts a bot user for the garbo service client id', async () => {
    const botUser = { id: 'u1', name: GARBO_SERVICE_CLIENT_ID, bot: true }
    prismaMock.user.upsert.mockResolvedValue(botUser)

    const result = await getOrCreateServiceBotUser()

    expect(result).toEqual(botUser)
    expect(prismaMock.user.upsert).toHaveBeenCalledWith({
      where: { name: GARBO_SERVICE_CLIENT_ID },
      update: {
        bot: true,
        email: 'garbo@klimatkollen.se',
      },
      create: {
        name: GARBO_SERVICE_CLIENT_ID,
        email: 'garbo@klimatkollen.se',
        bot: true,
      },
    })
  })

  it('supports other service client ids', async () => {
    prismaMock.user.upsert.mockResolvedValue({ id: 'u2', name: 'other-svc' })

    await getOrCreateServiceBotUser('other-svc')

    expect(prismaMock.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: 'other-svc' },
        create: expect.objectContaining({ email: 'other-svc@klimatkollen.se' }),
      })
    )
  })
})
