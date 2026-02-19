import { companyService } from '../src/api/services/companyService'
import type { Company } from '@prisma/client'
import apiConfig from '../src/config/api'

interface LogoUrlsResponse {
  count: number
  companyLogoUrls: Array<{
    wikidataId: string
    logoUrl: string | null
  }>
}

const { secret, baseURL } = apiConfig
const cleanBaseURL = baseURL.replace(/\/+$/, '')
const companiesUrl = `${cleanBaseURL}/companies`

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

  if (!response.ok) {
    throw new Error(
      `Failed to get token: ${response.status} ${response.statusText}`,
    )
  }

  const data = await response.json()
  return data.token
}

const pushCompanyLogosToDb = async () => {
  try {
    // Step 1 - Get all companies
    const companies = await fetchCompaniesData()

    // Step 2 - Get all wikidataIDs with corresponding logo url
    const logoUrls = await fetchLogoUrls(companies)

    // Step 3 - Get auth token (only if using API)
    const token = secret ? await getApiToken('garbo') : null

    // Step 4 - Post logo url to DB
    await pushCompanyLogos(logoUrls, token)
  } catch (error) {
    console.error('Error in pushCompanyLogosToDb:', error)
    throw error
  }
}

const fetchCompaniesData = async () => {
  try {
    const companies = await companyService.getAllCompaniesWithMetadata()

    if (companies) {
      console.log(`Fetched ${companies.length} companies`)
      return companies
    }
    return []
  } catch (err) {
    console.error('Error fetching companies:', err)
    throw err
  }
}

const fetchLogoUrls = async (companies: Company[]) => {
  const headers = {
    'User-Agent': 'KlimatkollenFetcher/1.0 (contact: hej@klimatkollen.se)',
  }

  const companiesWikiData = await Promise.all(
    companies?.map(async (company: Company) => {
      const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${company.wikidataId}&props=claims&format=json`

      try {
        const response = await fetch(url, { headers })

        if (!response.ok) {
          console.error(
            `Failed to fetch ${company.wikidataId}: ${response.status}`,
          )
          return null
        }

        const text = await response.text()
        if (!text) {
          console.error(`Empty response for ${company.wikidataId}`)
          return null
        }

        try {
          const result = JSON.parse(text)
          return result
        } catch (parseError) {
          console.error(
            `Failed to parse JSON for ${company.wikidataId}:`,
            parseError,
          )
          console.error('Response text:', text.substring(0, 200))
          return null
        }
      } catch (err) {
        console.error(`Error fetching ${company.wikidataId}:`, err)
        return null
      }
    }),
  )

  if (companiesWikiData.length > 0) {
    const companyLogoUrls: Array<{
      wikidataId: string
      logoUrl: string | null
    }> = []

    companiesWikiData.forEach(async (company) => {
      if (!company || !company.entities) {
        return
      }

      const id = Object.keys(company.entities)[0]
      if (!id) {
        return
      }

      const path =
        company?.entities?.[
          id
        ]?.claims?.P154?.[0]?.mainsnak?.datavalue?.value?.replaceAll(
          ' ',
          '_',
        ) || null

      if (!path) {
        companyLogoUrls.push({ wikidataId: id, logoUrl: null })
        return
      }

      const url = `https://commons.wikimedia.org/wiki/Special:Redirect/file/${path}`
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',

        headers,
      })
      const finalUrl = response.url
      console.log('Original URL:', url)
      console.log('Final URL:', finalUrl)

      companyLogoUrls.push({ wikidataId: id, logoUrl: finalUrl })
    })

    console.log(`Found ${companyLogoUrls.length} logo URLs`)
    return { count: companyLogoUrls.length, companyLogoUrls }
  }

  return { count: 0, companyLogoUrls: [] }
}

const pushCompanyLogos = async (
  logoUrls: LogoUrlsResponse,
  token: string | null,
) => {
  if (!logoUrls || !logoUrls.companyLogoUrls) {
    console.log('No logo URLs to push')
    return
  }

  const baseUrl = `${env}/companies`

  for (const company of logoUrls.companyLogoUrls) {
    if (company.logoUrl) {
      try {
        // First get the company name
        const companyData = await companyService.getCompany(company.wikidataId)

        const response = await fetch(`${baseUrl}/${company.wikidataId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            wikidataId: company.wikidataId,
            name: companyData.name,
            logoUrl: company.logoUrl,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(
            `Failed to update ${company.wikidataId}: ${response.status}`,
            errorText,
          )
          continue
        }

        console.log(`Updated ${company.wikidataId} with logoUrl via API`)
      } catch (error) {
        console.error(`Error updating ${company.wikidataId}:`, error)
      }
    }
  }
}

pushCompanyLogosToDb()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
