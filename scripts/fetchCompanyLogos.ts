import { companyService } from '../src/api/services/companyService'
import type { Company } from '@prisma/client'
import 'dotenv/config'

const env = 'https://stage-api.klimatkollen.se/api'
const secret = process.env.API_SECRET

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

const pushCompanyLogosToDb = async () => {
  //Step 1 - Get all companies
  const companies = await fetchCompaniesData()
  console.log(companies)

  //Step 2 - Get all wikidataIDs with corresponding logo url
  const logoUrls = await fetchLogoUrls(companies)

  //Step 3 - Get auth token
  const token = await getApiToken('garbo')

  //Step 4 - Post logo url to DB
  await pushCompanyLogos(logoUrls, token)
}

const fetchCompaniesData = async () => {
  try {
    const companies = await companyService.getAllCompaniesWithMetadata()

    if (companies) {
      console.log('Fetching of companies data is complete.')
      return companies
    }
  } catch (err) {
    console.error(err)
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

        if (response) {
          const result = await response.json()
          if (result) {
            return result
          }
        }
      } catch (err) {
        console.error(err)
      }
    }),
  )

  if (companiesWikiData.length > 0) {
    const companyLogoUrls: any = []
    companiesWikiData.map((company) => {
      const id = Object.keys(company.entities)[0]
      const path = company?.entities?.[
        id
      ]?.claims?.P154?.[0]?.mainsnak?.datavalue?.value.replaceAll(' ', '_')

      const url = path
        ? `https://www.wikidata.org/wiki/${id}#/media/File:${path}`
        : null

      companyLogoUrls.push({ wikidataId: id, logoUrl: url })
    })
    return { count: companyLogoUrls.length, companyLogoUrls }
  }
}

const pushCompanyLogos = async (logoUrls, token) => {
  const baseUrl = 'https://stage-api.klimatkollen.se/api/companies'

  const vattenfall = logoUrls.companyLogoUrls.find((element) => {
    return element.wikidataId === 'Q157675'
  })

  try {
    const response = await fetch(`${baseUrl}/${vattenfall.wikidataId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        wikidataId: vattenfall.wikidataId,
        name: 'Vattenfall',
        logoUrl: vattenfall.logoUrl,
      }),
    })

    return response
  } catch (err) {
    console.log(err)
  }
}
pushCompanyLogosToDb()
