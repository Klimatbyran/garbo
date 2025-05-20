import WBK, { SearchResponse, EntityId, Entity } from 'wikibase-sdk'
import { WbGetEntitiesResponse } from 'wikibase-sdk/dist/src/helpers/parse_responses'
import { SearchEntitiesOptions } from 'wikibase-sdk/dist/src/queries/search_entities'

/*const transformData = (data: any): any => {
  return Object.entries(data)
    .map(([key, wikidata]: [string, any]) => {
      if (!wikidata || !wikidata.claims) return null

      const verifiedUrl = `https://www.wikidata.org/wiki/${wikidata.id}`

      const emissionsData = (wikidata.claims.P5991 || []).map(
        (emission: any) => {
          const year = emission.qualifiers.P580[0].datavalue.value.time.slice(
            1,
            5
          )
          const scope1Emission = emission.qualifiers.P3831
            ? parseFloat(emission.qualifiers.P3831[0].datavalue.value.amount)
            : null
          const scope2Emission = emission.qualifiers.P580
            ? parseFloat(emission.qualifiers.P580[0].datavalue.value.amount)
            : null
          const scope3Emission = emission.qualifiers.P582
            ? parseFloat(emission.qualifiers.P582[0].datavalue.value.amount)
            : null

          return {
            year: year,
            reference: emission.references[0].snaks.P854[0].datavalue.value,
            scope1: {
              emissions: scope1Emission,
              verified: verifiedUrl,
              unit: 'tCO2e',
            },
            scope2: {
              emissions: scope2Emission,
              verified: verifiedUrl,
              unit: 'tCO2e',
            },
            scope3: {
              emissions: scope3Emission,
              verified: verifiedUrl,
              unit: 'tCO2e',
              categories: {
                //TODO: add scope 3 categories
                '1_purchasedGoods': null,
                '2_capitalGoods': null,
                '3_fuelAndEnergyRelatedActivities': null,
                '4_upstreamTransportationAndDistribution': null,
                '5_wasteGeneratedInOperations': null,
                '6_businessTravel': null,
                '7_employeeCommuting': null,
                '8_upstreamLeasedAssets': null,
                '9_downstreamTransportationAndDistribution': null,
                '10_processingOfSoldProducts': null,
                '11_useOfSoldProducts': null,
                '12_endOfLifeTreatmentOfSoldProducts': null,
                '13_downstreamLeasedAssets': null,
                '14_franchises': null,
                '15_investments': null,
                '16_other': null,
              },
            },
          }
        }
      )

      return {
        node: wikidata.id,
        url: `https://www.wikidata.org/wiki/${wikidata.id}`,
        logo: wikidata.claims.P18
          ? `https://commons.wikimedia.org/wiki/File:${wikidata.claims.P18[0].mainsnak.datavalue.value}`
          : null,
        label: wikidata.labels ? wikidata.labels.en.value : key,
        description:
          wikidata.descriptions && wikidata.descriptions.en
            ? wikidata.descriptions.en.value
            : null,
        emissions: emissionsData,
      }
    })
    .filter((item) => item !== null)
}*/

const wbk = WBK({
  instance: 'https://www.wikidata.org',
  sparqlEndpoint: 'https://query.wikidata.org/sparql',
})

export async function searchCompany({
  companyName,
  language = 'sv',
}: {
  companyName: string
  language?: SearchEntitiesOptions['language']
}): Promise<SearchResponse['search']> {
  // TODO: try to search in multiple languages. Maybe we can find a page in English if it doesn't exist in Swedish?
  const searchEntitiesQuery = wbk.searchEntities({
    search: companyName,
    type: 'item',
    // IDEA: Maybe determine language based on report or company origin. Or maybe search in multiple languages.
    language,
    limit: 20,
  })

  const response = (await fetch(searchEntitiesQuery).then((res) =>
    res.json()
  )) as SearchResponse

  if (response.error) {
    throw new Error('Wikidata search failed: ' + response.error)
  }

  return response.search
}

export async function getWikidataEntities(ids: EntityId[]) {
  const url = wbk.getEntities({
    ids,
    props: ['info', 'claims', 'descriptions', 'labels'],
  })
  const { entities }: WbGetEntitiesResponse = await fetch(url).then((res) =>
    res.json()
  )

  return Object.values(entities) as (Entity & {
    labels: { [lang: string]: { language: string; value: string } }
    descriptions: { [lang: string]: { language: string; value: string } }
  })[]
}

export async function getWikipediaTitle(id: EntityId): Promise<string> {
  const url = wbk.getEntities({
    ids: [id],
    props: ['sitelinks'],
  })
  const { entities }: WbGetEntitiesResponse = await fetch(url).then((res) =>
    res.json()
  )
  const entity = entities[id]
  const title = entity?.sitelinks?.enwiki?.title ?? entity?.sitelinks?.svwiki?.title ?? null

  if (!title) {
    throw new Error('No Wikipedia site link found')
  }

  return title
}

export async function fetchLEIFromWikidata(companyName: string): Promise<{ lei?: string; wikidataId?: string } | null> {
  console.log(`🔍 Searching for '${companyName}' in Wikidata...`);

  const searchResults = await searchCompany({ companyName });
  if (!searchResults.length) {
    console.log(`⚠️ No Wikidata entry found for '${companyName}'.`);
    return null;
  }

  const entities = await getWikidataEntities(searchResults.map((result) => result.id));
  for (const entity of entities) {
    const claims = entity.claims || {};
    if (claims.P1278 && claims.P1278[0]?.mainsnak?.datavalue?.value) {
      const lei = claims.P1278[0].mainsnak.datavalue.value;
      console.log(`✅ Found LEI for '${companyName}': ${lei}`);
      return { lei, wikidataId: entity.id };
    }
  }

  
  return null;
}




