import WBK from 'wikibase-sdk'

const wbk = WBK({
  instance: 'https://www.wikidata.org',
  sparqlEndpoint: 'https://query.wikidata.org/sparql',
})

export async function searchCompany(companyName: string, retry = 3) {
  const searchEntitiesQuery = wbk.searchEntities({
    search: companyName,
    language: 'en',
    limit: 1,
  })

  const searchResults = await fetch(searchEntitiesQuery).then((res) =>
    res.json()
  )

  if (searchResults.search.length === 0 && retry > 0) {
    return searchCompany(
      companyName.split(' ').slice(0, -1).join(' '), // retry with Telia Group -> Telia
      retry - 1
    )
  }

  return searchResults.search
}
