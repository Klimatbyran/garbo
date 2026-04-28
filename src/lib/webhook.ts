import 'dotenv/config'

const allowedCallbackUrls = (process.env.ALLOWED_CALLBACK_URLS ?? '')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean)

export function isAllowedCallbackUrl(url: string): boolean {
  if (allowedCallbackUrls.length === 0) return false
  return allowedCallbackUrls.some((allowed) => url.startsWith(allowed))
}

export async function fireCallback(
  callbackUrl: string,
  payload: Record<string, unknown>,
  log: (msg: string) => void = console.log
): Promise<void> {
  if (!isAllowedCallbackUrl(callbackUrl)) {
    throw new Error(`Callback URL not in whitelist: ${callbackUrl}`)
  }

  log(`Firing callback to ${callbackUrl}`)
  const res = await fetch(callbackUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  log(`Callback response: ${res.status}`)
  if (!res.ok) {
    throw new Error(`Callback to ${callbackUrl} failed with status ${res.status}`)
  }
}
