import { jest } from '@jest/globals'

type TestMocks = {
  embeddingsCreate: jest.Mock
  query: jest.Mock
  redisConnect: jest.Mock
}

type VectorDbForTest = {
  getRelevantMarkdown: (
    url: string,
    queryTexts: string[],
    nResults?: number,
    log?: (msg: string) => void
  ) => Promise<string>
  getVectorCacheStats: () => {
    dedupWaits: number
  }
}

const originalEnv = { ...process.env }

function setRequiredEnv() {
  process.env.CHROMA_HOST = 'http://localhost:8000'
  process.env.CHROMA_CHUNK_SIZE = '1200'
  process.env.OPENAI_API_KEY = 'test-key'
  process.env.OPENAI_ORG_ID = 'test-org'
  process.env.REDIS_HOST = 'localhost'
  process.env.REDIS_PORT = '6379'
  process.env.REDIS_PASSWORD = 'pass'
}

async function loadVectorDbWithMocks(args: {
  redisConnectFails: boolean
  queryDelayMs?: number
}): Promise<{ vectorDB: VectorDbForTest; mocks: TestMocks }> {
  const { redisConnectFails, queryDelayMs = 0 } = args

  const embeddingsCreate = jest.fn(async () => ({
    data: [{ embedding: [0.1, 0.2, 0.3] }],
  }))

  const query = jest.fn(async () => {
    if (queryDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, queryDelayMs))
    }

    return {
      metadatas: [
        [{ paragraph: 'P1' }, { paragraph: 'P2' }, { paragraph: 'P1' }],
      ],
    }
  })

  const redisConnect = redisConnectFails
    ? jest.fn(async () => {
        throw new Error('Redis down')
      })
    : jest.fn(async () => undefined)

  const redisClient = {
    isOpen: false,
    on: jest.fn(),
    connect: redisConnect,
    get: jest.fn(async () => null),
    set: jest.fn(async () => 'OK'),
    del: jest.fn(async () => 1),
  }

  const getOrCreateCollection = jest.fn(async () => ({
    query,
    add: jest.fn(async () => undefined),
    get: jest.fn(async () => ({ documents: [] })),
    delete: jest.fn(async () => undefined),
  }))

  class MockOpenAI {
    embeddings = {
      create: embeddingsCreate,
    }
  }

  class MockChromaClient {
    getOrCreateCollection = getOrCreateCollection
  }

  class MockOpenAIEmbeddingFunction {
    constructor(_: unknown) {
      // no-op
    }
  }

  jest.unstable_mockModule('openai', () => ({
    default: MockOpenAI,
  }))

  jest.unstable_mockModule('chromadb', () => ({
    ChromaClient: MockChromaClient,
    OpenAIEmbeddingFunction: MockOpenAIEmbeddingFunction,
  }))

  jest.unstable_mockModule('redis', () => ({
    createClient: jest.fn(() => redisClient),
  }))

  const imported = await import('../src/lib/vectordb')
  const vectorDB = imported.vectorDB as VectorDbForTest

  return {
    vectorDB,
    mocks: {
      embeddingsCreate,
      query,
      redisConnect,
    },
  }
}

describe('vectordb cache behavior', () => {
  beforeEach(() => {
    jest.resetModules()
    setRequiredEnv()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    jest.restoreAllMocks()
  })

  test('falls back when Redis is unavailable', async () => {
    const { vectorDB, mocks } = await loadVectorDbWithMocks({
      redisConnectFails: true,
    })

    const markdown = await vectorDB.getRelevantMarkdown(
      'https://example.com/report.pdf',
      ['scope 1 emissions'],
      10,
      () => undefined
    )

    expect(markdown).toBe('P1\n\nP2')
    expect(mocks.redisConnect).toHaveBeenCalled()
    expect(mocks.embeddingsCreate).toHaveBeenCalledTimes(1)
    expect(mocks.query).toHaveBeenCalledTimes(1)
  })

  test('coalesces concurrent identical retrieval requests', async () => {
    const { vectorDB, mocks } = await loadVectorDbWithMocks({
      redisConnectFails: true,
      queryDelayMs: 20,
    })

    const url = 'https://example.com/report.pdf'
    const queryTexts = ['scope 1 emissions', 'scope 2 emissions']

    const [a, b] = await Promise.all([
      vectorDB.getRelevantMarkdown(url, queryTexts, 10, () => undefined),
      vectorDB.getRelevantMarkdown(url, queryTexts, 10, () => undefined),
    ])

    expect(a).toBe('P1\n\nP2')
    expect(b).toBe('P1\n\nP2')
    expect(mocks.embeddingsCreate).toHaveBeenCalledTimes(1)
    expect(mocks.query).toHaveBeenCalledTimes(1)

    const stats = vectorDB.getVectorCacheStats()
    expect(stats.dedupWaits).toBeGreaterThanOrEqual(1)
  })
})
