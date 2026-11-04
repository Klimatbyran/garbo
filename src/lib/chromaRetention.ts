// Keeps Chroma small: chunks are deleted after a TTL (see workers/chromaSweep.ts),
// and searches that find nothing for a report rebuild it from Report.markdown.

const HOUR_MS = 60 * 60 * 1000

/** Chroma `where` filter matching chunks indexed before the TTL cutoff. */
export function staleChunksWhere(nowMs: number, ttlHours: number) {
  return { indexedAt: { $lt: nowMs - ttlHours * HOUR_MS } }
}

type Log = (msg: string) => void

export class ReportNotIndexedError extends Error {
  constructor(url: string) {
    super(
      `Chroma has no chunks for ${url}, and there is no Report.markdown in Postgres to rebuild them from. Re-run the report from parsePdf so Docling parses it again.`
    )
    this.name = 'ReportNotIndexedError'
  }
}

/**
 * Returns a function that (re)indexes a report from its stored markdown.
 * Concurrent calls for the same URL in this process share one rebuild, so the
 * follow-ups that start together don't each embed the whole report.
 */
export function createReindexFromStoredMarkdown(deps: {
  loadMarkdown: (url: string) => Promise<string | null>
  index: (url: string, markdown: string, log: Log) => Promise<void>
}) {
  const inFlight = new Map<string, Promise<void>>()

  return (url: string, log: Log): Promise<void> => {
    const existing = inFlight.get(url)
    if (existing) return existing

    const rebuild = (async () => {
      const markdown = await deps.loadMarkdown(url)
      if (!markdown?.trim()) throw new ReportNotIndexedError(url)
      log(
        `Chroma miss for ${url}: re-indexing ${markdown.length} chars from Report.markdown`
      )
      await deps.index(url, markdown, log)
    })().finally(() => inFlight.delete(url))

    inFlight.set(url, rebuild)
    return rebuild
  }
}

/**
 * Runs a Chroma query; if it returns nothing for the report, rebuilds the
 * report's chunks and runs the query once more.
 */
export async function queryWithReindexOnMiss<T>(
  url: string,
  query: () => Promise<T[]>,
  reindex: (url: string, log: Log) => Promise<void>,
  log: Log
): Promise<T[]> {
  const first = await query()
  if (first.length > 0) return first

  await reindex(url, log)
  return query()
}
