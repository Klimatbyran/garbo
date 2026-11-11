import 'dotenv/config'
import pipelineApiConfig from '../config/pipelineApi'

const allowedCallbackUrls = (process.env.ALLOWED_CALLBACK_URLS ?? '')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean)

/**
 * Allow only http(s) callback URLs whose origin matches an allowlist entry.
 * Prefix `startsWith` is rejected: `https://allowed.example.com.evil` must not
 * match `https://allowed.example.com`.
 */
export function isAllowedCallbackUrl(url: string): boolean {
  if (allowedCallbackUrls.length === 0) return false

  let candidate: URL
  try {
    candidate = new URL(url)
  } catch {
    return false
  }

  if (candidate.protocol !== 'http:' && candidate.protocol !== 'https:') {
    return false
  }
  if (candidate.username || candidate.password) {
    return false
  }

  return allowedCallbackUrls.some((allowed) => {
    try {
      const base = new URL(allowed)
      if (base.protocol !== 'http:' && base.protocol !== 'https:') return false
      if (candidate.origin !== base.origin) return false
      // Optional path prefix on the pathname only (not the full string).
      return candidate.pathname.startsWith(base.pathname)
    } catch {
      return false
    }
  })
}

const CALLBACK_TIMEOUT_MS = 30_000

export async function fireCallback(
  callbackUrl: string,
  payload: Record<string, unknown>,
  log: (msg: string) => void = console.log
): Promise<void> {
  if (!isAllowedCallbackUrl(callbackUrl)) {
    throw new Error(`Callback URL not in whitelist: ${callbackUrl}`)
  }

  log(`Firing callback to ${callbackUrl}`)
  // doclingParsePDF runs at concurrency 1 — an unresponsive callback URL
  // would otherwise stall every subsequent PDF parse indefinitely.
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), CALLBACK_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // climate-plans-pipeline's /webhook requires this — same shared
        // secret already used for our own pipeline-api calls (see
        // config/pipelineApi.ts), so no new secret to provision.
        ...(pipelineApiConfig.internalServiceToken
          ? {
              'x-internal-service-token':
                pipelineApiConfig.internalServiceToken,
            }
          : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(
        `Callback to ${callbackUrl} timed out after ${CALLBACK_TIMEOUT_MS}ms`
      )
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
  log(`Callback response: ${res.status}`)
  if (!res.ok) {
    throw new Error(
      `Callback to ${callbackUrl} failed with status ${res.status}`
    )
  }
}
