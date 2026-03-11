import { getLEINumber } from '../src/lib/wikidata'
import { getLEINumbers } from '../src/lib/gleif'
import { leiPrompt, leiSchema } from '../src/prompts/lei'
import { ask } from '../src/lib/openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs'

const env = 'https://api.klimatkollen.se/api'
const secret = ''

async function getApiToken(user: string) {
  const response = await fetch(`${env}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: user,
      client_secret: secret,
    }),
  })

  return (await response.json()).token
}

async function getLEINumberFromGleif(
  companyName: string
): Promise<string | undefined> {
  console.log(`fetching LEI for ${companyName} from Gleif API`)
  const searchResults = await getLEINumbers(companyName)

  if (!searchResults || searchResults.length === 0) {
    console.log(searchResults)
    return
  }

  const response = await ask(
    [
      {
        role: 'system',
        content: `I have a company named ${companyName} and I am looking for the wikidata entry related to this company. Be helpful and try to be accurate.`,
      },
      { role: 'user', content: leiPrompt },
      {
        role: 'assistant',
        content: 'OK. Just send me the wikidata search results?',
      },
      {
        role: 'user',
        content: JSON.stringify(searchResults, null, 2),
      },
    ].filter((m) => m && m.content?.length > 0) as ChatCompletionMessageParam[],
    { response_format: zodResponseFormat(leiSchema, 'lei') }
  )

  const { success, error, data } = leiSchema.safeParse(JSON.parse(response))

  if (error || !success) {
    throw new Error('Failed to parse ' + error.message)
  }

  return data.lei
}

async function updateLEI(
  wikidataId: string,
  name: string,
  token: string,
  lei: string
) {
  const response = await fetch(`${env}/companies/${wikidataId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ lei, wikidataId, name }),
  })
  return response
}

async function getCompanies(): Promise<
  { lei: string; wikidataId: string; name: string }[]
> {
  const response = await fetch(`${env}/companies`)
  return await response.json()
}

async function pushLeiNumbers(): Promise<string[]> {
  const token = await getApiToken('garbo')
  const updatedCompanies: string[] = []
  const companies = await getCompanies()

  for (const company of companies) {
    if (!company.lei) {
      let lei =
        (await getLEINumber(company.wikidataId as `Q${number}`)) ??
        (await getLEINumberFromGleif(company.name))
      if (lei) {
        console.log(`Updating LEI ${lei} for ${company.wikidataId}`)
        await updateLEI(company.wikidataId, company.name, token, lei)
        updatedCompanies.push(company.wikidataId)
        break
      }
    }
  }
  return updatedCompanies
}

pushLeiNumbers()
