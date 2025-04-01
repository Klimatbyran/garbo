import apiConfig from '../config/api'

let GARBO_TOKEN: {
  token: string | null,
  prod: boolean
} = {
  token: null,
  prod: false
};

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

async function ensureToken(isProd: boolean) {
  if(isProd) {
    return apiConfig.api_tokens.split(",")[0]; //temporary fix as long as prod is on the old auth system
  }
  if (!GARBO_TOKEN.token || GARBO_TOKEN.prod !== isProd) {
    GARBO_TOKEN.token = await getApiToken(isProd? apiConfig.prod_secret : apiConfig.secret);
    GARBO_TOKEN.prod = isProd;
  }
  return GARBO_TOKEN.token
}

export async function apiFetch(
  endpoint: string,
  { body, ...customConfig }: Omit<RequestInit, 'body'> & { body?: any } = {},  
  prodApi: boolean = false,
) {
  const token = await ensureToken(prodApi)

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

  const response = await fetch(`${prodApi? apiConfig.prod_base_url : apiConfig.baseURL}${endpoint}`, config)
  if (response.ok) {
    const newToken = response.headers.get('x-auth-token')
    if (newToken) {
      GARBO_TOKEN.token = newToken
    }
    return response.json()
  } else {
    const errorMessage = await response.text()
    const status = response.status
    if (status === 404) return null

    throw new Error('API error:' + errorMessage)
  }
}
