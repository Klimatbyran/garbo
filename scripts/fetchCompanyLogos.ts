import { companyService } from '../src/api/services/companyService'

const pushCompanyLogosToDb = async () => {
  const companies = await fetchCompaniesData()

  const logoUrls = await fetchLogoUrls(companies)
  console.log(logoUrls)
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

const fetchLogoUrls = async (companies) => {
  const headers = {
    'User-Agent': 'KlimatkollenFetcher/1.0 (contact: hej@klimatkollen.se)',
  }

  const companiesWikiData = await Promise.all(
    companies?.map(async (company) => {
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
    const companyLogoUrls = companiesWikiData.map((company) => {
      const id = Object.keys(company.entities)[0]
      const url =
        company?.entities?.[id]?.claims?.P154?.[0]?.mainsnak?.datavalue?.value

      return {
        wikiDataId: id,
        logoUrl: url,
      }
    })
    return { count: companyLogoUrls.length, ...companyLogoUrls }
  }
}
pushCompanyLogosToDb()
