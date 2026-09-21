export type DoclingPageSnippet = {
  text: string
  /** Precomputed once for matching — avoids re-normalizing every chunk. */
  normalized: string
  pageNumber: number
}

type DoclingTextLike = {
  text?: string
  prov?: Array<{ page_no?: number }>
}

type DoclingTableLike = {
  prov?: Array<{ page_no?: number }>
  data?: { table_cells?: Array<{ text?: string }> }
}

type PendingSnippet = {
  text: string
  pageNumber: number
  kind: 'text' | 'table'
}

const MIN_SNIPPET_LENGTH = 12
const MAX_SNIPPET_TEXT_LENGTH = 400
const MAX_SNIPPETS = 2500

function pageNumberFromProv(
  prov: Array<{ page_no?: number }> | undefined
): number | undefined {
  const page = prov?.find((item) => typeof item.page_no === 'number')?.page_no
  return typeof page === 'number' && Number.isFinite(page) && page >= 1
    ? Math.floor(page)
    : undefined
}

export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N}.,%-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function pushPending(
  pending: PendingSnippet[],
  seen: Set<string>,
  text: string | undefined,
  pageNumber: number | undefined,
  kind: 'text' | 'table'
) {
  if (typeof text !== 'string' || pageNumber === undefined) return
  const trimmed = text.replace(/\s+/g, ' ').trim()
  if (trimmed.length < MIN_SNIPPET_LENGTH) return

  const clipped =
    trimmed.length > MAX_SNIPPET_TEXT_LENGTH
      ? trimmed.slice(0, MAX_SNIPPET_TEXT_LENGTH)
      : trimmed
  const key = `${pageNumber}:${normalizeForMatch(clipped)}`
  if (seen.has(key)) return
  seen.add(key)
  pending.push({ text: clipped, pageNumber, kind })
}

/**
 * Build a compact text→page index from Docling JSON.
 * Includes both `texts` and table cell strings (tables are not in `texts`).
 * Used only for page lookup — never to replace Docling markdown.
 *
 * Snippets are interleaved by page (texts + tables together) so the
 * MAX_SNIPPETS cap does not starve later GHG table pages.
 */
export function pageSnippetsFromDoclingJson(
  jsonContent: unknown
): DoclingPageSnippet[] {
  if (!jsonContent || typeof jsonContent !== 'object') return []

  const document = jsonContent as {
    texts?: DoclingTextLike[]
    tables?: DoclingTableLike[]
  }
  const pending: PendingSnippet[] = []
  const seen = new Set<string>()

  for (const item of document.texts ?? []) {
    pushPending(
      pending,
      seen,
      item.text,
      pageNumberFromProv(item.prov),
      'text'
    )
  }

  for (const table of document.tables ?? []) {
    const pageNumber = pageNumberFromProv(table.prov)
    for (const cell of table.data?.table_cells ?? []) {
      pushPending(pending, seen, cell.text, pageNumber, 'table')
    }
  }

  // Prefer earlier pages first, but keep table cells interleaved with texts
  // on the same page so emissions tables are not dropped by the cap.
  pending.sort((a, b) => {
    if (a.pageNumber !== b.pageNumber) return a.pageNumber - b.pageNumber
    if (a.kind !== b.kind) return a.kind === 'table' ? -1 : 1
    return 0
  })

  return pending.slice(0, MAX_SNIPPETS).map(({ text, pageNumber }) => ({
    text,
    pageNumber,
    normalized: normalizeForMatch(text),
  }))
}

/**
 * Find the best page number for a markdown chunk by searching Docling snippets.
 * Prefers the longest snippet contained in the chunk.
 */
export function pageNumberForMarkdownSnippet(
  markdownSnippet: string,
  pageSnippets: DoclingPageSnippet[]
): number | undefined {
  if (!pageSnippets.length) return undefined
  const chunk = normalizeForMatch(markdownSnippet)
  if (chunk.length < MIN_SNIPPET_LENGTH) return undefined

  let best: { pageNumber: number; score: number } | undefined

  for (const snippet of pageSnippets) {
    const needle = snippet.normalized || normalizeForMatch(snippet.text)
    if (needle.length < MIN_SNIPPET_LENGTH) continue

    let score = 0
    if (chunk.includes(needle)) {
      score = needle.length
    } else if (needle.includes(chunk) && chunk.length >= 40) {
      score = chunk.length
    } else {
      // Match on a stable prefix of the chunk (helps overlapping window chunks).
      const prefixLen = Math.min(96, chunk.length)
      const prefix = chunk.slice(0, prefixLen)
      if (prefix.length >= MIN_SNIPPET_LENGTH && needle.includes(prefix)) {
        score = prefix.length
      }
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { pageNumber: snippet.pageNumber, score }
    }
  }

  return best?.pageNumber
}

export function extractDoclingMarkdown(
  resultData: {
    document?: { md_content?: string | null; json_content?: unknown }
  },
  options: { includePageSnippets?: boolean } = {}
): {
  markdown: string
  pageSnippets: DoclingPageSnippet[]
} {
  const markdown = resultData.document?.md_content
  if (!markdown) {
    throw new Error('No markdown content found in result')
  }

  const includePageSnippets = options.includePageSnippets !== false

  return {
    markdown,
    pageSnippets: includePageSnippets
      ? pageSnippetsFromDoclingJson(resultData.document?.json_content)
      : [],
  }
}
