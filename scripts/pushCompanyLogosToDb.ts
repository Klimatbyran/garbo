import { companyService } from '../src/api/services/companyService'
import type { Company } from '@prisma/client'
import apiConfig from '../src/config/api'
import { parse } from 'tldts'

const { secret, baseURL } = apiConfig
const cleanBaseURL = baseURL.replace(/\/+$/, '')
const companiesUrl = `${cleanBaseURL}/companies`

async function getApiToken(user: string) {
  const url = `${cleanBaseURL}/auth/token`
  const response = await fetch(url, {
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
      `Failed to get token: ${response.status} ${response.statusText}`
    )
  }

  const data = await response.json()
  return data.token
}

const pushCompanyLogosToDb = async (overwriteExistingLogos: boolean) => {
  try {
    // Step 1 - Get all companies
    let companies = (await fetchCompaniesData()) as Company[]

    // Step 2 - Filter if needed
    if (!overwriteExistingLogos) {
      companies = companies.filter((c) => c.logoUrl == null)
    }

    // Step 3 - Get all wikidataIDs with corresponding website URL
    const companyUrls = await fetchWebsiteUrls(companies)

    // Step 4 - Generate logo URLs to logo.dev
    const logoUrls = generateLogoUrls(companyUrls)

    // Step 5 - Get auth token (only if using API)
    const token = secret ? await getApiToken('garbo') : null

    // Step 5 - Post logo url to DB
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

const fetchWebsiteUrls = async (companies: Company[]) => {
  const headers = {
    'User-Agent': 'KlimatkollenFetcher/1.0 (contact: hej@klimatkollen.se)',
  }

  const companyUrls: Array<{ wikidataId: string; url: string }> = []

  while (companies.length > 0) {
    const companiesToFetch = companies.splice(0, 50)

    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${companiesToFetch.map((c) => c.wikidataId).join('|')}&props=claims&format=json`

    try {
      const response = await fetch(url, { headers })

      if (!response.ok) {
        throw new Error(`Failed to fetch company data: ${response.status}`)
      }

      const text = await response.text()

      if (!text) {
        throw new Error('Empty response company data response')
      }

      const companiesWikiData = JSON.parse(text)

      if (!companiesWikiData.entities) {
        throw new Error(`Invalid reponse: ${text}`)
      }

      companiesToFetch.forEach((company: Company) => {
        const companyData = companiesWikiData.entities[company.wikidataId]

        if (companyData) {
          const companyWebsiteJson =
            companyData.claims?.P856?.find(
              (a: { rank: string }) => a.rank == 'preferred'
            ) ?? companyData.claims?.P856?.at(0)
          const url: string =
            companyWebsiteJson?.mainsnak?.datavalue?.value ?? null

          if (url) {
            companyUrls.push({ wikidataId: company.wikidataId, url: url })
          }
        }
      })
    } catch (err) {
      console.error(`Error fetching company data:`, err)
    }
  }

  return companyUrls
}

const generateLogoUrls = (
  companyWebsites: { wikidataId: string; url: string }[]
) => {
  const logoUrls: Array<{ wikidataId: string; logoUrl: string }> = []

  for (const companyWebsite of companyWebsites) {
    try {
      const domain = parse(companyWebsite.url).domain

      logoUrls.push({
        wikidataId: companyWebsite.wikidataId,
        logoUrl: `https://img.logo.dev/${domain}`,
      })
    } catch (err) {
      console.error(
        `Error parsing company website URL: ${companyWebsite.url}:`,
        err
      )
    }
  }

  return logoUrls
}

const pushCompanyLogos = async (
  companyLogoUrls: {
    wikidataId: string
    logoUrl: string
  }[],
  token: string | null
) => {
  if (!companyLogoUrls || companyLogoUrls.length == 0) {
    console.log('No logo URLs to push')
    return
  }

  for (const company of companyLogoUrls) {
    if (company.logoUrl) {
      try {
        // First get the company name
        const companyData = await companyService.getCompany(company.wikidataId)

        const response = await fetch(`${companiesUrl}/${company.wikidataId}`, {
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
            errorText
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

const overwriteExistingLogos = process.argv.includes('--overwrite')

pushCompanyLogosToDb(overwriteExistingLogos)
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
