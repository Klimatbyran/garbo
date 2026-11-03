import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  afterAll,
  jest,
} from '@jest/globals'

// Keep a developer's local .env out of these tests.
jest.unstable_mockModule('dotenv/config', () => ({}))

const saved = {
  model: process.env.OPENAI_CONTEXT_FALLBACK_MODEL,
  enabled: process.env.OPENAI_CONTEXT_FALLBACK_ENABLED,
}

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}

async function loadConfig(model?: string, enabled?: string) {
  setEnv('OPENAI_CONTEXT_FALLBACK_MODEL', model)
  setEnv('OPENAI_CONTEXT_FALLBACK_ENABLED', enabled)
  jest.resetModules()
  return (await import('./openai')).default
}

describe('openai config: contextFallbackModel', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  afterAll(() => {
    setEnv('OPENAI_CONTEXT_FALLBACK_MODEL', saved.model)
    setEnv('OPENAI_CONTEXT_FALLBACK_ENABLED', saved.enabled)
  })

  it('defaults to gpt-4.1 when nothing is set', async () => {
    expect((await loadConfig()).contextFallbackModel).toBe('gpt-4.1-2025-04-14')
  })

  it('uses the configured model', async () => {
    expect((await loadConfig(' gpt-4.1-mini ')).contextFallbackModel).toBe(
      'gpt-4.1-mini'
    )
    expect((await loadConfig('gpt-4.1', 'true')).contextFallbackModel).toBe(
      'gpt-4.1'
    )
  })

  it('is off when disabled', async () => {
    expect((await loadConfig(undefined, 'false')).contextFallbackModel).toBe(
      null
    )
  })

  it.each([
    ['an empty switch', undefined, ''],
    ['an unknown switch value', undefined, 'on'],
    ['an empty model', '', undefined],
  ])('fails at startup on %s', async (_name, model, enabled) => {
    await expect(loadConfig(model, enabled)).rejects.toThrow(
      'Invalid initialization of OpenAI environment variables'
    )
  })
})
