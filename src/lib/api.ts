import apiConfig from '../config/api'

let GARBO_TOKEN: string | null = null

async function getApiToken(secret: string) {
  const response = await fetch(`${apiConfig.baseURL}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: 'garbo',
      client_secret: secret,
    }),
  })

  return (await response.json()).token
}

async function ensureToken() {
  if (!GARBO_TOKEN) {
    GARBO_TOKEN = await getApiToken(apiConfig.secret)
  }
  return GARBO_TOKEN
}

export async function apiFetch(
  endpoint: string,
  { body, ...customConfig }: Omit<RequestInit, 'body'> & { body?: any } = {}
) {
  const token = await ensureToken()

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
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

  const response = await fetch(`${apiConfig.baseURL}${endpoint}`, config)
  if (response.ok) {
    const newToken = response.headers.get('x-auth-token')
    if (newToken) {
      GARBO_TOKEN = newToken
    }
    return response.json()
  } else {
    const errorMessage = await response.text()
    const status = response.status
    if (status === 404) return null

    throw new Error('API error:' + errorMessage)
  }
}
