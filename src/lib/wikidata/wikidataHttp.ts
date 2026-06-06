export const WIKIDATA_SEARCH_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'KlimatkollenGarboBot/1.0 (+https://klimatkollen.se)',
} as const

export async function fetchJsonWithRetries<T = unknown>(
  url: string,
  {
    headers,
    maxAttempts = 3,
    expectedContentType = 'application/json',
    context,
  }: {
    headers?: Record<string, string>
    maxAttempts?: number
    expectedContentType?: string
    context?: string
  }
): Promise<T> {
  let attempt = 0
  let res: Response | undefined
  while (attempt < maxAttempts) {
    res = await fetch(url, { headers })
    if (res.ok) break
    if ([429, 502, 503, 504].includes(res.status)) {
      await new Promise((r) => setTimeout(r, (attempt + 1) * 1000))
      attempt++
      continue
    }
    break
  }

  const ctx = context ? `${context} ` : ''

  if (!res) {
    throw new Error(`${ctx}no response received`)
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `${ctx}HTTP ${res.status} ${res.statusText} – body: ${text.slice(0, 300)}`
    )
  }

  const ct = (res.headers.get('content-type') || '').toLowerCase()
  if (!ct.includes(expectedContentType)) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `${ctx}returned non-JSON (${ct}) – body: ${text.slice(0, 300)}`
    )
  }

  return (await res.json()) as T
}
