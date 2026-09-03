export type DoclingPageSnippet = {
  text: string
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

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N}.,%-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function pushSnippet(
  snippets: DoclingPageSnippet[],
  seen: Set<string>,
  text: string | undefined,
  pageNumber: number | undefined
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
  snippets.push({ text: clipped, pageNumber })
}

/**
 * Build a compact text→page index from Docling JSON.
 * Includes both `texts` and table cell strings (tables are not in `texts`).
 * Used only for page lookup — never to replace Docling markdown.
 */
export function pageSnippetsFromDoclingJson(
  jsonContent: unknown
): DoclingPageSnippet[] {
  if (!jsonContent || typeof jsonContent !== 'object') return []

  const document = jsonContent as {
    texts?: DoclingTextLike[]
    tables?: DoclingTableLike[]
  }
  const snippets: DoclingPageSnippet[] = []
  const seen = new Set<string>()

  for (const item of document.texts ?? []) {
    if (snippets.length >= MAX_SNIPPETS) break
    pushSnippet(snippets, seen, item.text, pageNumberFromProv(item.prov))
  }

  for (const table of document.tables ?? []) {
    if (snippets.length >= MAX_SNIPPETS) break
    const pageNumber = pageNumberFromProv(table.prov)
    for (const cell of table.data?.table_cells ?? []) {
      if (snippets.length >= MAX_SNIPPETS) break
      pushSnippet(snippets, seen, cell.text, pageNumber)
    }
  }

  return snippets
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
    const needle = normalizeForMatch(snippet.text)
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

export function extractDoclingMarkdown(resultData: {
  document?: { md_content?: string | null; json_content?: unknown }
}): {
  markdown: string
  pageSnippets: DoclingPageSnippet[]
} {
  const markdown = resultData.document?.md_content
  if (!markdown) {
    throw new Error('No markdown content found in result')
  }

  return {
    markdown,
    pageSnippets: pageSnippetsFromDoclingJson(
      resultData.document?.json_content
    ),
  }
}
