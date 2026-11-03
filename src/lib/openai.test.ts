import {
  jest,
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
} from '@jest/globals'
// Real SDK error classes, as `chat.completions.create` throws them. This path
// is not the mocked 'openai' entry point.
import {
  AuthenticationError,
  BadRequestError,
  InternalServerError,
  NotFoundError,
  RateLimitError,
} from 'openai/core/error'

type CreateParams = { model: string; stream: boolean }

const create = jest.fn<(params: CreateParams) => Promise<unknown>>()

jest.unstable_mockModule('openai', () => ({
  default: class {
    chat = { completions: { create } }
  },
}))

// Same default as src/config/openai.ts; tests change it per case.
const DEFAULT_FALLBACK = 'gpt-4.1-2025-04-14'
const openaiConfigMock: {
  apiKey: string
  contextFallbackModel: string | null
} = { apiKey: 'jest-openai-api-key', contextFallbackModel: DEFAULT_FALLBACK }

jest.unstable_mockModule('../config/openai', () => ({
  default: openaiConfigMock,
}))

let askStream: typeof import('./openai').askStream
let askStreamWithModel: typeof import('./openai').askStreamWithModel

beforeAll(async () => {
  ;({ askStream, askStreamWithModel } = await import('./openai'))
})

beforeEach(() => {
  create.mockReset()
  openaiConfigMock.contextFallbackModel = DEFAULT_FALLBACK
  jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

async function* streamOf(...chunks: string[]) {
  for (const content of chunks) {
    yield { choices: [{ delta: { content } }] }
  }
}

const headers = new Headers()
const body = (message: string, code?: string) => ({
  message,
  type: 'invalid_request_error',
  code,
})

// The two wordings OpenAI uses when gpt-4o's window is exceeded.
const messagesTooLong = new BadRequestError(
  400,
  body(
    "This model's maximum context length is 128000 tokens. However, your messages resulted in 135065 tokens. Please reduce the length of the messages.",
    'context_length_exceeded'
  ),
  undefined,
  headers
)
const completionDoesNotFit = new BadRequestError(
  400,
  body(
    "This model's maximum context length is 128000 tokens. However, you requested 133651 tokens (117267 in the messages, 16384 in the completion). Please reduce the length of the messages or completion.",
    'context_length_exceeded'
  ),
  undefined,
  headers
)

const messages = [{ role: 'user' as const, content: 'Results from PDF: ...' }]

const calledModels = () => create.mock.calls.map(([params]) => params.model)

describe('askStreamWithModel', () => {
  it('answers on gpt-4o when the input fits', async () => {
    create.mockResolvedValueOnce(streamOf('{"a":', '1}'))

    const outcome = await askStreamWithModel(messages, {})

    expect(outcome).toEqual({
      response: '{"a":1}',
      model: 'gpt-4o-2024-08-06',
    })
    expect(calledModels()).toEqual(['gpt-4o-2024-08-06'])
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('makes exactly one new call on gpt-4.1 after a context-window error', async () => {
    create
      .mockRejectedValueOnce(messagesTooLong)
      .mockResolvedValueOnce(streamOf('{"a":1}\n', '{"b":2}'))
    const onParagraph = jest.fn()

    const outcome = await askStreamWithModel(messages, { onParagraph })

    expect(outcome).toEqual({
      response: '{"a":1}\n{"b":2}',
      model: 'gpt-4.1-2025-04-14',
    })
    expect(calledModels()).toEqual(['gpt-4o-2024-08-06', 'gpt-4.1-2025-04-14'])
    // Same request apart from the model.
    const [first, second] = create.mock.calls.map(([params]) => params)
    expect({ ...second, model: first.model }).toEqual(first)
    // Paragraphs only come from the answering stream.
    expect(onParagraph.mock.calls).toEqual([
      ['{"a":1}\n', '{"a":1}\n'],
      ['{"a":1}\n{"b":2}', '{"b":2}'],
    ])
    expect(console.warn).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['the answer does not fit next to the input', completionDoesNotFit],
    [
      'the error has the wording but no code',
      new BadRequestError(
        400,
        body("This model's maximum context length is 128000 tokens."),
        undefined,
        headers
      ),
    ],
  ])('also uses gpt-4.1 when %s', async (_name, error) => {
    create.mockRejectedValueOnce(error).mockResolvedValueOnce(streamOf('{}'))

    await expect(askStreamWithModel(messages, {})).resolves.toEqual({
      response: '{}',
      model: 'gpt-4.1-2025-04-14',
    })
    expect(calledModels()).toEqual(['gpt-4o-2024-08-06', 'gpt-4.1-2025-04-14'])
  })

  it.each([
    [
      'a rate limit',
      new RateLimitError(
        429,
        body('Rate limit reached for gpt-4o', 'rate_limit_exceeded'),
        undefined,
        headers
      ),
    ],
    [
      'a schema error',
      new BadRequestError(
        400,
        body(
          "Invalid schema for response_format 'scope3'",
          'invalid_json_schema'
        ),
        undefined,
        headers
      ),
    ],
    [
      'an auth error',
      new AuthenticationError(
        401,
        body('Incorrect API key provided', 'invalid_api_key'),
        undefined,
        headers
      ),
    ],
    [
      'a server error with the same wording',
      new InternalServerError(
        500,
        body("This model's maximum context length is 128000 tokens."),
        undefined,
        headers
      ),
    ],
  ])('does not use gpt-4.1 on %s', async (_name, error) => {
    create.mockRejectedValueOnce(error)

    await expect(askStreamWithModel(messages, {})).rejects.toBe(error)
    expect(calledModels()).toEqual(['gpt-4o-2024-08-06'])
  })

  it('does not use gpt-4.1 on an empty response', async () => {
    create.mockResolvedValueOnce(streamOf())

    await expect(askStreamWithModel(messages, {})).resolves.toEqual({
      response: '',
      model: 'gpt-4o-2024-08-06',
    })
    expect(calledModels()).toEqual(['gpt-4o-2024-08-06'])
  })

  it('fails with the gpt-4.1 error when the input does not fit there either', async () => {
    const fallbackTooLong = new BadRequestError(
      400,
      body(
        "This model's maximum context length is 1047576 tokens. However, your messages resulted in 1100000 tokens. Please reduce the length of the messages.",
        'context_length_exceeded'
      ),
      undefined,
      headers
    )
    create
      .mockRejectedValueOnce(messagesTooLong)
      .mockRejectedValueOnce(fallbackTooLong)

    await expect(askStreamWithModel(messages, {})).rejects.toBe(fallbackTooLong)
    expect(calledModels()).toEqual(['gpt-4o-2024-08-06', 'gpt-4.1-2025-04-14'])
  })

  it('says the input was too long when the fallback fails for another reason', async () => {
    openaiConfigMock.contextFallbackModel = 'gpt-4.1x'
    const notFound = new NotFoundError(
      404,
      body('The model `gpt-4.1x` does not exist', 'model_not_found'),
      undefined,
      headers
    )
    create
      .mockRejectedValueOnce(messagesTooLong)
      .mockRejectedValueOnce(notFound)

    const failure = await askStreamWithModel(messages, {}).catch(
      (e: unknown) => e
    )

    expect(failure).toBeInstanceOf(Error)
    expect((failure as Error).message).toBe(
      'Input too long for gpt-4o-2024-08-06, and the retry on gpt-4.1x failed: 404 The model `gpt-4.1x` does not exist'
    )
    expect((failure as Error).cause).toBe(notFound)
    expect(calledModels()).toEqual(['gpt-4o-2024-08-06', 'gpt-4.1x'])
  })

  it('uses the configured fallback model', async () => {
    openaiConfigMock.contextFallbackModel = 'gpt-4.1-mini'
    create
      .mockRejectedValueOnce(messagesTooLong)
      .mockResolvedValueOnce(streamOf('{}'))

    await expect(askStreamWithModel(messages, {})).resolves.toEqual({
      response: '{}',
      model: 'gpt-4.1-mini',
    })
    expect(calledModels()).toEqual(['gpt-4o-2024-08-06', 'gpt-4.1-mini'])
  })

  it.each([
    ['turned off', null],
    ['the primary model', 'gpt-4o-2024-08-06'],
  ])(
    'fails as before when the fallback is %s',
    async (_name, fallbackModel) => {
      openaiConfigMock.contextFallbackModel = fallbackModel
      create.mockRejectedValueOnce(messagesTooLong)

      await expect(askStreamWithModel(messages, {})).rejects.toBe(
        messagesTooLong
      )
      expect(calledModels()).toEqual(['gpt-4o-2024-08-06'])
    }
  )
})

describe('askStream', () => {
  it('still returns only the text', async () => {
    create.mockResolvedValueOnce(streamOf('{"a":1}'))

    await expect(askStream(messages, {})).resolves.toBe('{"a":1}')
  })
})
