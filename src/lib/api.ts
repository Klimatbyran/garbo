import apiConfig from '../config/api'

const GARBO_TOKEN = apiConfig.tokens.find((token) => token.startsWith('garbo'))

export async function apiFetch(
  endpoint: string,
  environment = 'production',
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

  const baseUrl =
    environment === 'staging'
      ? 'https://stage-api.klimatkollen.se/api'
      : apiConfig.baseURL
  const response = await fetch(`${baseUrl}${endpoint}`, config)
  if (response.ok) {
    return response.json()
  } else {
    const errorMessage = await response.text()
    const status = response.status
    if (status === 404) return null

    throw new Error('API error:' + errorMessage)
  }
}
