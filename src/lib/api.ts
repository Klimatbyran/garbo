const BASE_URL = 'http://localhost:3000/api'

import { ENV } from './env'

const GARBO_TOKEN = ENV.API_TOKENS.find((token) => token.startsWith('garbo'))

async function saveToAPI(
  endpoint: string,
  { body, ...customConfig }: RequestInit = {}
) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${GARBO_TOKEN}`,
  }
  const config: RequestInit = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  }
  if (body) {
    config.body = typeof body !== 'string' ? JSON.stringify(body) : body
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config)
  if (response.ok) {
    return response.json()
  } else {
    const errorMessage = await response.text()
    return Promise.reject(new Error('API error:' + errorMessage))
  }
}

export async function saveCompany(
  wikidataId: string,
  subEndpoint: string,
  body: any
) {
  return saveToAPI(`/companies/${wikidataId}/${subEndpoint}`, { body })
}
