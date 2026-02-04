import { z } from 'zod'
import { ask } from '@/lib/openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { ChatCompletionMessageParam } from 'openai/resources'
import { getWikidataEntities, searchCompany } from '@/lib/wikidata/read'

// Schema för Wikidata-resultat
export const wikidataSchema = z.object({
  wikidata: z.object({
    node: z.string(),
    url: z.string(),
    logo: z.string().optional(),
    label: z.string(),
    description: z.string().optional(),
  }),
})

export type WikidataResult = z.infer<typeof wikidataSchema>['wikidata']

// Prompt för att välja rätt Wikidata-entitet
const selectionPrompt = `Please choose the appropriate wikidata node and return it as json. Prioritize the node with information about GHG carbon footprint if there are any.

Needs to be valid json. No comments etc here. Never guess any values. Only use the information from the context. Company Name should be filled from the wikidata node. Keep the syntax below:
\`\`\`json
{ "wikidata":
   {
    "node": "Q123456",
    "url": "https://www.wikidata.org/wiki/Q123456",
    "logo": "https://commons.wikimedia.org/wiki/File:Example.jpg",
    "label": "Company Name",
    "description": "Company Description",
  }
}
\`\`\`

Please help me select the appropriate node id based on the wikidata search results below.
Prioritize the company with carbon footprint reporting (claim: P5991). Also prioritize swedish companies.
`

// Insignificant words to filter out from company name
const insignificantWords = new Set([
  'ab',
  'the',
  'and',
  'inc',
  'co',
  'publ',
  '(publ)',
  '(ab)',
  'aktiebolag',
  'aktiebolaget',
])

/**
 * Search for company on Wikidata with retry logic
 */
async function searchWikidataWithRetry({
  companyName,
  retry = 0,
}: {
  companyName: string
  retry?: number
}): Promise<any[]> {
  if (retry > 3) return []

  const results = await searchCompany({ companyName })

  if (results.length) return results

  // First retry: remove insignificant words
  if (retry === 0) {
    const simplifiedCompanyName = companyName
      .split(/\s+/)
      .filter((word) => !insignificantWords.has(word.toLowerCase()))
      .join(' ')

    return searchWikidataWithRetry({
      companyName: simplifiedCompanyName,
      retry: retry + 1,
    })
  }

  // Second retry: remove last word
  const name = companyName.split(' ').slice(0, -1).join(' ')
  return name
    ? searchWikidataWithRetry({
        companyName: name,
        retry: retry + 1,
      })
    : []
}

/**
 * Identify company on Wikidata
 * This is a pure function with no side effects
 *
 * @param companyName - Name of the company to identify
 * @returns Wikidata result with company information
 * @throws Error if company cannot be identified
 */
export async function identifyCompany(
  companyName: string,
): Promise<WikidataResult> {
  if (!companyName || !companyName.trim()) {
    throw new Error('Company name is required')
  }

  // Search for company on Wikidata
  const searchResults = await searchWikidataWithRetry({ companyName })

  if (searchResults.length === 0) {
    throw new Error(`No Wikidata entry found for "${companyName}"`)
  }

  // Get full entity data
  const results = await getWikidataEntities(
    searchResults.map((result) => result.id) as `Q${number}`[],
  )

  if (results.length === 0) {
    throw new Error(`No Wikidata entity data found for "${companyName}"`)
  }

  // Order results: prioritize companies with carbon footprint (P5991)
  const orderedResults = results
    .sort((a, b) => {
      const hasEmissions = (e: any) => Boolean(e?.claims?.P5991)
      return hasEmissions(a) ? -1 : hasEmissions(b) ? 1 : 0
    })
    .map((e) => {
      // Exclude claims to reduce token usage
      return { ...e, claims: undefined }
    })

  // Use AI to select the best match
  const response = await ask(
    [
      {
        role: 'system',
        content: `I have a company named ${companyName} and I am looking for the wikidata entry related to this company. Be helpful and try to be accurate.`,
      },
      { role: 'user', content: selectionPrompt },
      {
        role: 'assistant',
        content: 'OK. Just send me the wikidata search results?',
      },
      {
        role: 'user',
        content: JSON.stringify(orderedResults, null, 2),
      },
    ].filter((m) => m && m.content?.length > 0) as ChatCompletionMessageParam[],
    {
      response_format: zodResponseFormat(wikidataSchema, 'wikidata-selection'),
    },
  )

  const { success, error, data } = wikidataSchema.safeParse(
    JSON.parse(response),
  )

  if (error || !success) {
    throw new Error(`Failed to parse Wikidata selection: ${error?.message}`)
  }

  if (!data.wikidata?.node) {
    throw new Error('Could not parse wikidataId from selection result')
  }

  return data.wikidata
}

/**
 * Search for company on Wikidata and return all potential matches
 * This is useful when you want to show options to the user
 *
 * @param companyName - Name of the company to search for
 * @returns Array of potential Wikidata matches
 */
export async function searchCompanyOptions(
  companyName: string,
): Promise<Array<{ id: string; label: string; description: string }>> {
  if (!companyName || !companyName.trim()) {
    throw new Error('Company name is required')
  }

  const searchResults = await searchWikidataWithRetry({ companyName })

  if (searchResults.length === 0) {
    return []
  }

  const entities = await getWikidataEntities(
    searchResults.map((result) => result.id) as `Q${number}`[],
  )

  return entities.map((entity) => ({
    id: entity.id,
    label:
      entity.labels?.sv?.value ??
      entity.labels?.en?.value ??
      Object.values(entity.labels ?? {})[0]?.value ??
      '',
    description:
      entity.descriptions?.sv?.value ??
      entity.descriptions?.en?.value ??
      Object.values(entity.descriptions ?? {})[0]?.value ??
      '',
  }))
}
