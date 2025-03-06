import apiConfig from '../config/api'

const GARBO_TOKEN = await getApiToken(apiConfig.secret)

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

  const token = (await response.json()).token
  console.log(token)
  return token
}

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

  const response = await fetch(`${apiConfig.baseURL}${endpoint}`, config)
  if (response.ok) {
    return response.json()
  } else {
    const errorMessage = await response.text()
    const status = response.status
    if (status === 404) return null

    throw new Error('API error:' + errorMessage)
  }
}
