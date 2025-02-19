import WBK, { SearchResponse, EntityId, Entity, ItemId } from 'wikibase-sdk'
import { WbGetEntitiesResponse } from 'wikibase-sdk/dist/src/helpers/parse_responses'
import { SearchEntitiesOptions } from 'wikibase-sdk/dist/src/queries/search_entities'
import wikidataConfig from '../config/wikidata'
import WBEdit from 'wikibase-edit'

const wbk = WBK({
  instance: wikidataConfig.wikidataURL,
  sparqlEndpoint: 'https://query.wikidata.org/sparql',
})

const wikibaseEditConfig = {
  instance: wikidataConfig.wikidataURL,
  anonymous: true
}

const {
  TONNE_OF_CARBON_DIOXIDE_EQUIVALENT,
  GHG_PROTOCOL,
} = wikidataConfig.entities;

const {
  CARBON_FOOTPRINT,
  START_TIME,
  END_TIME,
  DETERMINATION_METHOD_OR_STANDARD,
  REFERENCE_URL,
  OBJECT_OF_STATEMENT_HAS_ROLE,
  APPLIES_TO_PART
} = wikidataConfig.properties;

export async function searchCompany({
  companyName,
  language = 'sv',
}: {
  companyName
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
    labels: { [lang]: { language; value } }
    descriptions: { [lang]: { language; value } }
  })[]
}

export async function getClaims(entity: ItemId) {
  const url = wbk.getEntities({
      ids: entity,
      languages: ["en"]
  })
  console.log("this");

  return fetch(url).then(res => res.json());
}

export async function updateClaim(guid: string, value: string) {
  const wbEdit = WBEdit(wikibaseEditConfig)
  const claimUpdate = {
      guid,
      newValue:  {
          amount: value,
          unit: TONNE_OF_CARBON_DIOXIDE_EQUIVALENT
      }
  }    
  await wbEdit.claim.update(claimUpdate);
}

export async function updateReference(guid: string, referenceUrl: string, referenceHash: string) {
  const wbEdit = WBEdit(wikibaseEditConfig)
  wbEdit.reference.set({
    guid,
    hash: referenceHash,
    snaks: {
      [REFERENCE_URL]: referenceUrl
    }
  })
}

export async function createReference(guid: string, referenceUrl: string) {
  const wbEdit = WBEdit(wikibaseEditConfig)
  wbEdit.reference.set({
    guid,
    snaks: {
      [REFERENCE_URL]: referenceUrl
    }
  })
}

export async function createClaim(entity: ItemId, startDate: string, endDate: string, value: string, referenceUrl: string, scope?: ItemId, category?: ItemId) {
  const wbEdit = WBEdit(wikibaseEditConfig);
  const claimCreate = {
    id: entity,
    property: CARBON_FOOTPRINT,
    value: {
        amount: value,
        unit: TONNE_OF_CARBON_DIOXIDE_EQUIVALENT
    },
    qualifiers: {
        [START_TIME]: startDate,
        [END_TIME]: endDate,
        [DETERMINATION_METHOD_OR_STANDARD]: GHG_PROTOCOL,
    },
    references: [
        {[REFERENCE_URL]: referenceUrl}
    ]
  };

  if(scope !== undefined) {
      claimCreate.qualifiers[OBJECT_OF_STATEMENT_HAS_ROLE] = scope;
  }

  if(category !== undefined) {
      claimCreate.qualifiers[APPLIES_TO_PART] = category;
  }

  await wbEdit.claim.create(claimCreate);
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
