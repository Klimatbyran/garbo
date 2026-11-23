import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals'

const saved = process.env.ALLOWED_CALLBACK_URLS

async function loadWebhook(allowlist: string) {
  process.env.ALLOWED_CALLBACK_URLS = allowlist
  jest.resetModules()
  jest.unstable_mockModule('../config/pipelineApi', () => ({
    default: { internalServiceToken: 'test-token' },
  }))
  return import('./webhook')
}

describe('isAllowedCallbackUrl', () => {
  afterEach(() => {
    if (saved === undefined) delete process.env.ALLOWED_CALLBACK_URLS
    else process.env.ALLOWED_CALLBACK_URLS = saved
    jest.resetModules()
  })

  it('rejects prefix lookalikes of an allowed origin', async () => {
    const { isAllowedCallbackUrl } = await loadWebhook(
      'https://allowed.example.com/webhook'
    )
    expect(
      isAllowedCallbackUrl('https://allowed.example.com.evil/webhook')
    ).toBe(false)
    expect(isAllowedCallbackUrl('https://allowed.example.com/webhook')).toBe(
      true
    )
    expect(
      isAllowedCallbackUrl('https://allowed.example.com/webhook/extra')
    ).toBe(true)
    expect(isAllowedCallbackUrl('https://allowed.example.com/other')).toBe(
      false
    )
  })

  it('rejects non-http schemes and userinfo', async () => {
    const { isAllowedCallbackUrl } = await loadWebhook(
      'https://allowed.example.com/'
    )
    expect(isAllowedCallbackUrl('javascript:alert(1)')).toBe(false)
    expect(isAllowedCallbackUrl('https://user:pass@allowed.example.com/')).toBe(
      false
    )
  })
})
