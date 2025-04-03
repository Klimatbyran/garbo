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
  credentials: {
    oauth: {
      'consumer_key': wikidataConfig.wikidataConsumerKey,
      'consumer_secret': wikidataConfig.wikidataConsumerSecret,
      'token': wikidataConfig.wikidataToken,
      'token_secret': wikidataConfig.wikidataTokenSecet
    }
  },
  userAgent: 'KlimatkollenGarbotBot/v0.1.0 (https://klimatkollen.se)',
}

const {
  TONNE_OF_CARBON_DIOXIDE_EQUIVALENT,
  GHG_PROTOCOL,
  SCOPE_1,
  SCOPE_2,
  SCOPE_2_LOCATION_BASED,
  SCOPE_2_MARKET_BASED,
  SCOPE_3,
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

export async function getClaims(entity: ItemId): Promise<Claim[]> {
  const url = wbk.getEntities({
      ids: entity,
      languages: ["en"]
  })

  const res = await fetch(url);
  const wikidataEntities = (await res.json()).entities;

  if(wikidataEntities === undefined) {
    return [];
  }

  const claims = wikidataEntities[entity].claims;

  if(claims === undefined) {
    return [];
  }
  
  const carbonFootprintClaims = claims[CARBON_FOOTPRINT] ?? [];

  return carbonFootprintClaims.map(claim => {
    return {
      startDate: transformFromWikidataDateStringToDate(claim.qualifiers[START_TIME][0].datavalue.value.time),
      endDate: transformFromWikidataDateStringToDate(claim.qualifiers[END_TIME][0].datavalue.value.time),
      value: claim.mainsnak.datavalue.value.amount,
      category: claim.qualifiers[APPLIES_TO_PART] ? claim.qualifiers[APPLIES_TO_PART][0].datavalue.value.id : undefined,
      scope: claim.qualifiers[OBJECT_OF_STATEMENT_HAS_ROLE][0].datavalue.value.id,
      id: claim.id
    } as Claim
  })
}

export async function editEntity(entity: ItemId, claims: Claim[], removeClaim: RemoveClaim[]) {
  const wbEdit = WBEdit(wikibaseEditConfig);
  const claimBody = claims.map((claim) => {
    const claimObject = {
      value: {
          amount: claim.value,
          unit: TONNE_OF_CARBON_DIOXIDE_EQUIVALENT
      },
      qualifiers: {
          [START_TIME]: claim.startDate,
          [END_TIME]: claim.endDate,
          [DETERMINATION_METHOD_OR_STANDARD]: GHG_PROTOCOL,
      },
      references: [
        {[REFERENCE_URL]: claim.referenceUrl}
      ]
    }

    if(claim.scope !== undefined) {
      claimObject.qualifiers[OBJECT_OF_STATEMENT_HAS_ROLE] = claim.scope;
    }

    if(claim.category !== undefined) {
      claimObject.qualifiers[APPLIES_TO_PART] = claim.category;
    }

    return claimObject;
  }) 
  
  const body = {
    id: entity,
    claims: {
      [CARBON_FOOTPRINT]: [
        ...claimBody,
        ...removeClaim
      ]
    },
    summary: "Added/Updated carbon footprint data"
  }

  await wbEdit.entity.edit(body);
}


/**
 * Compares if two claims have the same scope and optionally category
 * @param newClaim 
 * @param exisitingClaim 
 * @returns true if scope and category are equal
 */
function compareClaims(newClaim: Claim, exisitingClaim: Claim) { 
  if( (newClaim.scope === undefined && exisitingClaim.scope !== undefined) ||
      (newClaim.scope !== undefined && (exisitingClaim.scope === undefined || exisitingClaim.scope !== newClaim.scope))) {
      return false;
  }
  if( (newClaim.category === undefined && exisitingClaim.category !== undefined) ||
      (newClaim.category !== undefined && (exisitingClaim.category === undefined || exisitingClaim.category !== newClaim.category))) {
      return false;
  }
  return true;
}


/**
 * Compares two date strings
 * @param date1 
 * @param date2 
 * @returns difference in milliseconds
 */
function compareDateStrings(date1?: string, date2?: string) {
  const epoch = "1970-01-01T00:00:00Z";
  return (new Date(date1 || epoch)).getTime() - (new Date(date2 || epoch).getTime())
}


/**
 * Calculates the claims to add and which to remove in order to update the entity
 * @param entity Entity for which the exisiting and adding Claims should be compared
 * @param claims The claims to add
 * @returns 
 */
async function diffCarbonFootprintClaims(entity: ItemId, claims: Claim[]) {
  const existingClaims = await getClaims(entity);
  const newClaims: Claim[] = [];
  const rmClaims: RemoveClaim[] = [];

  for(const claim of claims) {
    let duplicate = false;
    for(const existingClaim of existingClaims) {
      /**
       * Bit of explanaiton for the different cases
       * The compareClaim function looks if there is already a claim with the same scope and optional category
       * If that is the case we only want the most recent claim of that scope and category to be on wikidata
       * Therefore, we look at the end date of the claim's reporting period to find the most recent one
       * All older claims will not be added or are removed if there are on wikidata 
       */
      if(compareClaims(claim, existingClaim)) {
        if(compareDateStrings(existingClaim.endDate, claim.endDate) < 0) {
            if(existingClaim.id !== undefined) {
              rmClaims.push({id: existingClaim.id, remove: true});  //Remove older claims;
            } 
            continue;
        } else if(compareDateStrings(existingClaim.endDate, claim.endDate) > 0) {
            duplicate = true; //If there is a more recent one do not add that claim
        } else if(compareDateStrings(existingClaim.endDate, claim.endDate) === 0
        && compareDateStrings(existingClaim.startDate, claim.startDate) === 0) {
          if(("+" + claim.value) !== existingClaim.value) {
            newClaims.push(claim); //Update value by removing old claim and adding new claim
            if(existingClaim.id !== undefined) {
              rmClaims.push({id: existingClaim.id, remove: true});
            }             
          }          
          duplicate = true;
        } else {
          newClaims.push(claim); //if for some reason the start times differ we still opt for our claim
          if(existingClaim.id !== undefined) {
            rmClaims.push({id: existingClaim.id, remove: true});
          } 
          duplicate = true;
        }          
      }      
    }
    if(!duplicate) {
      newClaims.push(claim); //only add claims that not exist already
    }
  }
  return {newClaims, rmClaims};
}

export async function bulkCreateOrEditCarbonFootprintClaim(entity: ItemId, claims: Claim[]) {
  const {newClaims, rmClaims} = await diffCarbonFootprintClaims(entity, claims);  
  await editEntity(entity, newClaims, rmClaims);
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

function transformFromWikidataDateStringToDate(date: string) {
  return date.substring(1);
}

export function transformEmissionsToClaims(emissions, startDate, endDate, referenceUrl): Claim[] {
    const claims: Claim[] = [];

    if(emissions.scope1?.total !== undefined) {
      claims.push({
          startDate,
          endDate,
          referenceUrl,
          scope: SCOPE_1,
          value: emissions.scope1.total,
      });
    }
    if(emissions.scope2?.mb !== undefined) {
      claims.push({
          scope: SCOPE_2_MARKET_BASED,
          startDate,
          endDate,
          referenceUrl,
          value: emissions.scope2.mb,
      });
    }
    if(emissions.scope2?.lb !== undefined) {
      claims.push({
          scope: SCOPE_2_LOCATION_BASED,
          startDate,
          endDate,
          referenceUrl,
          value: emissions.scope2.lb,
      });
    }
    if(emissions.scope2?.unknown !== undefined) {
      claims.push({
        scope: SCOPE_2,
        startDate,
        endDate,
        referenceUrl,
        value: emissions.scope2.unknown,
      });
    }    
    emissions.scope3?.categories?.forEach(category => {
        claims.push({
            scope: SCOPE_3,
            startDate,
            endDate,
            referenceUrl,
            category: wikidataConfig.translateIdToCategory(category.category),
            value: category.total,
        });
    });

    return claims;
}

export function reduceToMostRecentClaims(claims: Claim[]): Claim[] {
  const claimMap = new Map<string, Claim>();

  for(const claim of claims) {
    if(claimMap.has(claim.scope + "-" + (claim.category ?? ""))) {
      const exisitingClaim = claimMap.get(claim.scope + "-" + (claim.category ?? ""));
      if(exisitingClaim?.endDate === undefined || exisitingClaim.endDate < claim.endDate) {
        claimMap.set(claim.scope + "-" + (claim.category ?? ""), claim);
      }
    } else {
      claimMap.set(claim.scope + "-" + (claim.category ?? ""), claim);
    }
  }

  return Array.from(claimMap.values());
}

export interface Claim {
  id?: string;
  startDate: string;
  endDate: string;
  value: string;
  referenceUrl?: string;
  scope?: ItemId;
  category?: ItemId;
}

export interface RemoveClaim {
  id: string;
  remove: boolean;
}
