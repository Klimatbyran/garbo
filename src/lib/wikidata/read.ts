import {
  Entity,
  EntityId,
  ItemId,
  SearchResponse,
} from 'wikibase-sdk'
import { Claim, transformFromWikidataDateStringToDate, wbk } from './util'
import { WbGetEntitiesResponse } from 'wikibase-sdk/dist/src/helpers/parse_responses'
import { SearchEntitiesOptions } from 'wikibase-sdk/dist/src/queries/search_entities'
import wikidataConfig from '../../config/wikidata'
import {
  fetchJsonWithRetries,
  WIKIDATA_SEARCH_HEADERS,
} from './wikidataHttp'

const {
  CARBON_FOOTPRINT,
  START_TIME,
  END_TIME,
  REFERENCE_URL,
  OBJECT_OF_STATEMENT_HAS_ROLE,
  APPLIES_TO_PART,
  ARCHIVE_URL,
} = wikidataConfig.properties

export async function getWikipediaTitle(id: EntityId): Promise<string> {
  const url = wbk.getEntities({
    ids: [id],
    props: ['sitelinks'],
  })
  const { entities }: WbGetEntitiesResponse = await fetch(url).then((res) =>
    res.json()
  )
  const entity = entities[id]
  const sitelinks = entity?.type === 'item' ? entity.sitelinks : undefined
  const title = sitelinks?.enwiki?.title ?? sitelinks?.svwiki?.title ?? null

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

  const { claims } = wikidataEntities[entity]

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
  companyName: string
  language?: SearchEntitiesOptions['language']
}): Promise<SearchResponse['search']> {
  const searchEntitiesQuery = wbk.searchEntities({
    search: companyName,
    type: 'item',
    language,
    limit: 20,
  })

  const response = await fetchJsonWithRetries<SearchResponse>(
    searchEntitiesQuery,
    {
      headers: { ...WIKIDATA_SEARCH_HEADERS },
      maxAttempts: 3,
      expectedContentType: 'application/json',
      context: 'Wikidata search',
    }
  )

  if (response.error) {
    const msg = response.error.info || response.error.code
    throw new Error(`Wikidata search failed: ${msg}`)
  }

  return response.search ?? []
}

export async function getWikidataEntities(ids: `Q${number}`[]) {
  const url = wbk.getEntities({
    ids,
    props: ['info', 'claims', 'descriptions', 'labels'],
  })

  const { entities }: WbGetEntitiesResponse =
    await fetchJsonWithRetries<WbGetEntitiesResponse>(url, {
      headers: { ...WIKIDATA_SEARCH_HEADERS },
      maxAttempts: 3,
      expectedContentType: 'application/json',
      context: 'Wikidata entities',
    })

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
    const res = await fetch(url)
    if (!res.ok) {
      console.log(`Error ${res.status} ${res.statusText}`)
      throw new Error('Could not get entity claims')
    }

    const wikidataEntities = (await res.json()).entities
    if (wikidataEntities === undefined) {
      return []
    }

    const { claims } = wikidataEntities[entity]
    if (claims === undefined) {
      return []
    }

    const carbonFootprintClaims = claims[CARBON_FOOTPRINT] ?? []

    return carbonFootprintClaims.map((claim) => {
      const references =
        claim.references?.length > 0 ? claim.references[0].snaks : undefined

      const getQualifierValue = (
        propertyId: string,
        transformFn?: (value: unknown) => unknown
      ) => {
        const snaks = claim.qualifiers?.[propertyId]
        if (!snaks?.length) return ''
        const [
          {
            datavalue: { value },
          },
        ] = snaks
        return transformFn ? transformFn(value) : value
      }

      const getReferenceValue = (propertyId: string) => {
        if (!references || !references[propertyId]) return undefined
        return references[propertyId][0].datavalue.value
      }

      return {
        startDate: getQualifierValue(START_TIME, (value) =>
          transformFromWikidataDateStringToDate(
            (value as { time: string }).time
          )
        ),
        endDate: getQualifierValue(END_TIME, (value) =>
          transformFromWikidataDateStringToDate(
            (value as { time: string }).time
          )
        ),
        value: claim.mainsnak.datavalue.value.amount,
        category: getQualifierValue(
          APPLIES_TO_PART,
          (value) => (value as { id: ItemId }).id
        ),
        scope: getQualifierValue(
          OBJECT_OF_STATEMENT_HAS_ROLE,
          (value) => (value as { id: ItemId }).id
        ),
        id: claim.id,
        referenceUrl: getReferenceValue(REFERENCE_URL),
        archiveUrl: getReferenceValue(ARCHIVE_URL),
      } as Claim
    })
  } catch (error) {
    console.error(error)
    throw new Error(error)
  }
}
