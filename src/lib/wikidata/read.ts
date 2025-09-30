import { Entity, EntityId, ItemId, SearchResponse } from "wikibase-sdk"
import { Claim, transformFromWikidataDateStringToDate, wbk } from "./util"
import { WbGetEntitiesResponse } from "wikibase-sdk/dist/src/helpers/parse_responses"
import { SearchEntitiesOptions } from "wikibase-sdk/dist/src/queries/search_entities"
import wikidataConfig from "../../config/wikidata"

const {
  CARBON_FOOTPRINT,
  START_TIME,
  END_TIME,
  REFERENCE_URL,
  OBJECT_OF_STATEMENT_HAS_ROLE,
  APPLIES_TO_PART,
  ARCHIVE_URL,
} = wikidataConfig.properties;

export async function getWikipediaTitle(id: EntityId): Promise<string> {
  const url = wbk.getEntities({
    ids: [id],
    props: ['sitelinks'],
  })
  const { entities }: WbGetEntitiesResponse = await fetch(url).then((res) =>
    res.json()
  )
  const entity = entities[id] as any
  const title =
    entity?.sitelinks?.enwiki?.title ?? entity?.sitelinks?.svwiki?.title ?? null

  if (!title) {
    throw new Error('No Wikipedia site link found')
  }

  return title
}

export async function getLEINumber(
  entity: EntityId
): Promise<string | undefined> {
  const url = wbk.getEntities({
    ids: entity,
    languages: ['en'],
  })

  const res = await fetch(url)
  const wikidataEntities = (await res.json()).entities

  if (wikidataEntities === undefined) {
    return
  }

  const claims = wikidataEntities[entity].claims

  if (
    claims === undefined ||
    claims['P1278'] === undefined ||
    claims['P1278'].length === 0
  ) {
    return
  }

  return claims['P1278'][0].mainsnak.datavalue.value
}

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

export async function getWikidataEntities(ids: `Q${number}`[]) {
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

export async function getClaims(entity: ItemId): Promise<Claim[]> {
  const url = wbk.getEntities({
    ids: entity,
    languages: ['en'],
  })

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`Error ${res.status} ${res.statusText}`)
      throw new Error('Could not get entity claims')
    }

    const wikidataEntities = (await res.json()).entities
    if (wikidataEntities === undefined) {
      return []
    }

    const claims = wikidataEntities[entity].claims
    if (claims === undefined) {
      return []
    }

    const carbonFootprintClaims = claims[CARBON_FOOTPRINT] ?? []

    return carbonFootprintClaims.map((claim) => {
      const references = claim.references?.length > 0 ? claim.references[0].snaks : undefined

      const getQualifierValue = (propertyId: string, transformFn?: (value: any) => any) => {
        if (!claim.qualifiers || !claim.qualifiers[propertyId]) return '';
        const value = claim.qualifiers[propertyId][0].datavalue.value;
        return transformFn ? transformFn(value) : value;
      };

      const getReferenceValue = (propertyId) => {
        if (!references || !references[propertyId]) return undefined;
        return references[propertyId][0].datavalue.value;
      };

      return {
        startDate: getQualifierValue(START_TIME,
          value => transformFromWikidataDateStringToDate(value.time)),
        endDate: getQualifierValue(END_TIME,
          value => transformFromWikidataDateStringToDate(value.time)),
        value: claim.mainsnak.datavalue.value.amount,
        category: getQualifierValue(APPLIES_TO_PART, value => value.id),
        scope: getQualifierValue(OBJECT_OF_STATEMENT_HAS_ROLE, value => value.id),
        id: claim.id,
        referenceUrl: getReferenceValue(REFERENCE_URL),
        archiveUrl: getReferenceValue(ARCHIVE_URL),
      } as Claim
    })
  } catch(error) {
    console.error(error);
    throw new Error(error);
  }
}