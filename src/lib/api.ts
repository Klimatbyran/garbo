const BASE_URL = 'http://localhost:3000/api'

import { ENV } from './env'

const GARBO_TOKEN = ENV.API_TOKENS.find((token) => token.startsWith('garbo'))

export async function apiFetch(
  endpoint: string,
  { body, ...customConfig }: Omit<RequestInit, 'body'> & { body?: any } = {}
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
    const status = response.status
    if (status === 404) return null

    throw new Error('API error:' + errorMessage)
  }
}
