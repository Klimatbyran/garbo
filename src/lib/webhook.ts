import 'dotenv/config'

const allowedCallbackUrls = (process.env.ALLOWED_CALLBACK_URLS ?? '')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean)

export function isAllowedCallbackUrl(url: string): boolean {
  if (allowedCallbackUrls.length === 0) return false
  return allowedCallbackUrls.some((allowed) => url.startsWith(allowed))
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
      headers: { 'Content-Type': 'application/json' },
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
