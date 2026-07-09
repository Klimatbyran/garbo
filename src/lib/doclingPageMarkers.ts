const PAGE_MARKER = /<!-- PAGE: \d+ -->/

type DoclingTextItem = {
  text?: string
  prov?: Array<{ page_no?: number }>
}

/**
 * When Docling JSON includes per-text provenance, rebuild markdown with
 * `<!-- PAGE: N -->` markers (same convention as the legacy NLM ingest path).
 */
export function injectPageMarkersFromDoclingJson(
  mdContent: string,
  jsonContent: unknown
): string {
  if (PAGE_MARKER.test(mdContent)) return mdContent
  if (!jsonContent || typeof jsonContent !== 'object') return mdContent

  const texts = (jsonContent as { texts?: DoclingTextItem[] }).texts
  if (!Array.isArray(texts) || texts.length === 0) return mdContent

  let currentPage: number | undefined
  const parts: string[] = []

  for (const item of texts) {
    const text = typeof item.text === 'string' ? item.text.trim() : ''
    if (!text) continue

    const pageNo = item.prov?.find(
      (prov) => typeof prov.page_no === 'number'
    )?.page_no

    if (pageNo !== undefined && pageNo !== currentPage) {
      currentPage = pageNo
      parts.push(`\n<!-- PAGE: ${pageNo} -->\n`)
    }

    parts.push(text)
    parts.push('\n\n')
  }

  const rebuilt = parts.join('').trim()
  return rebuilt.length > 0 ? rebuilt : mdContent
}

export function doclingMarkdownWithPageMarkers(resultData: {
  document?: { md_content?: string; json_content?: unknown }
}): string {
  const md = resultData.document?.md_content
  if (!md) {
    throw new Error('No markdown content found in result')
  }

  const json = resultData.document?.json_content
  if (!json) return md

  return injectPageMarkersFromDoclingJson(md, json)
}
