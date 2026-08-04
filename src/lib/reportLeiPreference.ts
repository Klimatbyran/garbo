export type LeiPromptOptions = {
  /** When true, bias GLEIF selection toward Swedish subsidiaries. */
  preferSwedishEntities: boolean
}

/** Example shape for the LLM; must match {@link leiSchema} in `src/prompts/lei.ts`. */
const LEI_JSON_FORMAT = `\`\`\`json
{
  "lei": "12345678901234567890",
  "legalName": "Company Name"
}
\`\`\``

const SWEDISH_URL_HINT =
  /(?:^|[\/_.-])sv(?:[\/_.-]|$)|svenska|\.se(?:[/?#:]|$)|sverige/i

const NON_SWEDISH_URL_HINT = /(?:^|[\/_.-])en(?:[\/_.-]|$)|english|global/i

/**
 * Infer whether LEI selection should prefer Swedish entities from report URLs.
 * Defaults to false (group/parent LEI) when no Swedish signal is present.
 */
export function inferPreferSwedishLeiFromUrls(
  urls: Array<string | undefined | null>
): boolean {
  const combined = urls
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url))
    .join(' ')

  if (!combined) return false
  if (SWEDISH_URL_HINT.test(combined)) return true
  if (NON_SWEDISH_URL_HINT.test(combined)) return false
  return false
}

export function buildLeiPrompt(options: LeiPromptOptions): string {
  const selectionGuidance = options.preferSwedishEntities
    ? 'This report appears Sweden-specific — prefer Swedish legal entities (jurisdiction SE or names indicating Sweden) when they match the reporting scope.'
    : 'Prefer the ultimate parent or group reporting entity that matches the company and report scope. Do not prefer Swedish subsidiaries unless they are clearly the reporting entity for this document.'

  return `Please choose the appropriate lei number and return it as json.

Needs to be valid json. No comments etc here. Never guess any values. Only use the information from the context. Company Name should be filled from the wikidata node. Keep the syntax below:
${LEI_JSON_FORMAT}


Please help me select the appropriate legal entity identifier (LEI) based on the gleif api search results below. ${selectionGuidance}`
}
