/**
 * Docling serves its API routes under `/v1` (so DOCLING_URL usually ends in
 * `/v1`), but the health endpoint lives at the root: `/health`. Calling
 * `${DOCLING_URL}/health` therefore hits `/v1/health`, which doesn't exist and
 * is rejected (404, or 401 behind an API-key gateway).
 */
export function doclingHealthUrl(apiBaseUrl: string): string {
  const root = apiBaseUrl.replace(/\/+$/, '').replace(/\/v1$/, '')
  return `${root}/health`
}

/**
 * True only when Docling's `/health` answers 2xx. Any other status (e.g. a
 * 502/404 from a proxy in front of a stopped container), a network error or a
 * timeout counts as unhealthy.
 */
export async function isDoclingHealthy(
  apiBaseUrl: string,
  timeoutMs = 4_000
): Promise<boolean> {
  try {
    const res = await fetch(doclingHealthUrl(apiBaseUrl), {
      method: 'GET',
      signal: AbortSignal.timeout(timeoutMs),
    })
    return res.ok
  } catch {
    return false
  }
}
