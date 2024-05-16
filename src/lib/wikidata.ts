import WBK from 'wikibase-sdk'

const wbk = WBK({
  instance: 'https://www.wikidata.org',
  sparqlEndpoint: 'https://query.wikidata.org/sparql',
})

export async function searchCompany(companyName: string) {
  const searchEntitiesQuery = wbk.searchEntities({
    search: companyName,
    language: 'en',
    limit: 1,
  })

  const searchResults = await fetch(searchEntitiesQuery).then((res) =>
    res.json()
  )

  return searchResults.search
}

searchCompany('Volvo').then(console.log)
