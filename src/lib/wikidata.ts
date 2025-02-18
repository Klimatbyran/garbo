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
  SCOPE_1,
  SCOPE_2_MARKET_BASED,
  SCOPE_2_LOCATION_BASED,
  SCOPE_3
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

export async function findCarbonFootprintClaim(entity: ItemId, startDate: string, endDate: string, scope?: string, category?: string): Promise<{guid: string, referenceHash?: string}|undefined> {
  const url = wbk.getEntities({
      ids: entity,
      languages: ["en"]
  })

  const { entities } = await fetch(url).then(res => res.json());

  if(entities[entity].claims !== undefined && entities[entity].claims[CARBON_FOOTPRINT] !== undefined) {
      const propertyClaims = entities[entity].claims[CARBON_FOOTPRINT];
      for(const claim of propertyClaims) {
          const qualifiers = claim.qualifiers;     
          if(qualifiers[START_TIME] === undefined || qualifiers[START_TIME][0].datavalue.value.time !== startDate) {
              continue;
          }
          if(qualifiers[END_TIME] === undefined || qualifiers[END_TIME][0].datavalue.value.time !== endDate) {
              continue;
          }
          if( (scope === undefined && qualifiers[OBJECT_OF_STATEMENT_HAS_ROLE] !== undefined) ||
              (scope !== undefined && (qualifiers[OBJECT_OF_STATEMENT_HAS_ROLE] === undefined || qualifiers[OBJECT_OF_STATEMENT_HAS_ROLE][0].datavalue.value.id !== scope))) {
              continue;
          }
          if( (category === undefined && qualifiers[APPLIES_TO_PART] !== undefined) ||
              (category !== undefined && (qualifiers[APPLIES_TO_PART] === undefined || qualifiers[APPLIES_TO_PART][0].datavalue.value.id !== category))) {
              continue;
          }
          if(claim.references !== undefined && claim.references.length > 0) {
            return {guid: claim.id, referenceHash: claim.references[0].hash};
          } else {
            return {guid: claim.id};
          }

          
      }
  } 

  return undefined;
}

export async function createOrEditCarbonFootprintClaim(entity: ItemId, startDate: string, endDate: string, value: string, referenceUrl: string, scope?: ItemId, category?: ItemId) {
  if(scope === undefined && category !== undefined) {
      throw new Error("Cannot have a category without a scope");
  }  
  const wbEdit = WBEdit(wikibaseEditConfig)
  const claim = await findCarbonFootprintClaim(entity, startDate, endDate, scope, category);
  if(claim !== undefined) {
      const {guid, referenceHash} = claim;
      const claimUpdate = {
          guid,
          newValue:  {
              amount: value,
              unit: TONNE_OF_CARBON_DIOXIDE_EQUIVALENT
          },
          references: [
              {[REFERENCE_URL]: referenceUrl}
          ]
      }    
      await wbEdit.claim.update(claimUpdate);
      if(referenceHash !== undefined) {
        wbEdit.reference.set({
          guid,
          hash: referenceHash,
          snaks: {
            [REFERENCE_URL]: referenceUrl
          }
        })
      } else {
        wbEdit.reference.set({
          guid,
          snaks: {
            [REFERENCE_URL]: 'https://example.org/rise-and-fall-of-the-holy-sand-box'
          }
        })
      }
  } else {
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
export async function findCarbonFootprintClaim(entity: ItemId, startDate: string, endDate: string, scope?: string, category?: string): Promise<{guid: string, referenceHash?: string}|undefined> {
  const url = wbk.getEntities({
      ids: entity,
      languages: ["en"]
  })

  const { entities } = await fetch(url).then(res => res.json());

  if(entities[entity].claims !== undefined && entities[entity].claims[CARBON_FOOTPRINT] !== undefined) {
      const propertyClaims = entities[entity].claims[CARBON_FOOTPRINT];
      for(const claim of propertyClaims) {
          const qualifiers = claim.qualifiers;     
          if(qualifiers[START_TIME] === undefined || qualifiers[START_TIME][0].datavalue.value.time !== startDate) {
              continue;
          }
          if(qualifiers[END_TIME] === undefined || qualifiers[END_TIME][0].datavalue.value.time !== endDate) {
              continue;
          }
          if( (scope === undefined && qualifiers[OBJECT_OF_STATEMENT_HAS_ROLE] !== undefined) ||
              (scope !== undefined && (qualifiers[OBJECT_OF_STATEMENT_HAS_ROLE] === undefined || qualifiers[OBJECT_OF_STATEMENT_HAS_ROLE][0].datavalue.value.id !== scope))) {
              continue;
          }
          if( (category === undefined && qualifiers[APPLIES_TO_PART] !== undefined) ||
              (category !== undefined && (qualifiers[APPLIES_TO_PART] === undefined || qualifiers[APPLIES_TO_PART][0].datavalue.value.id !== category))) {
              continue;
          }
          if(claim.references !== undefined && claim.references.length > 0) {
            return {guid: claim.id, referenceHash: claim.references[0].hash};
          } else {
            return {guid: claim.id};
          }

          
      }
  } 

  return undefined;
}

export async function createOrEditCarbonFootprintClaim(entity: ItemId, startDate: string, endDate: string, value: string, referenceUrl: string, scope?: ItemId, category?: ItemId) {
  if(scope === undefined && category !== undefined) {
      throw new Error("Cannot have a category without a scope");
  }  
  const wbEdit = WBEdit(wikibaseEditConfig)
  const claim = await findCarbonFootprintClaim(entity, startDate, endDate, scope, category);
  if(claim !== undefined) {
      const {guid, referenceHash} = claim;
      const claimUpdate = {
          guid,
          newValue:  {
              amount: value,
              unit: TONNE_OF_CARBON_DIOXIDE_EQUIVALENT
          },
          references: [
              {[REFERENCE_URL]: referenceUrl}
          ]
      }    
      await wbEdit.claim.update(claimUpdate);
      if(referenceHash !== undefined) {
        wbEdit.reference.set({
          guid,
          hash: referenceHash,
          snaks: {
            [REFERENCE_URL]: referenceUrl
          }
        })
      } else {
        wbEdit.reference.set({
          guid,
          snaks: {
            [REFERENCE_URL]: 'https://example.org/rise-and-fall-of-the-holy-sand-box'
          }
        })
      }
  } else {
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
}
