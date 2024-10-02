const BASE_URL = 'http://localhost:3000/api'
const GARBO_TOKEN = 'garbo:auth-123'

export async function saveToAPI(
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
    config.body = JSON.stringify(body)
  }

  return fetch(`${BASE_URL}${endpoint}`, config).then(async (response) => {
    if (response.ok) {
      return response.json()
    } else {
      const errorMessage = await response.text()
      return Promise.reject(new Error(errorMessage))
    }
  })
}

export async function saveCompany(
  wikidataId: string,
  subEndpoint: string,
  body: any
) {
  return saveToAPI(`/companies/${wikidataId}/${subEndpoint}`, { body })
}
