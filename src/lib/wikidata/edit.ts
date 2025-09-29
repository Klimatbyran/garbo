import { ItemId } from 'wikibase-sdk'
import wikidataConfig from '../../config/wikidata'
import WBEdit from 'wikibase-edit'
import { RemoveClaim, Claim, wikibaseEditConfig, compareClaims, compareDateStrings } from './util'
import { getClaims } from './read'

const {
  TONNE_OF_CARBON_DIOXIDE_EQUIVALENT,
  GHG_PROTOCOL,
  SCOPE_2,
  SCOPE_2_LOCATION_BASED,
  SCOPE_2_MARKET_BASED,
  SCOPE_3,
} = wikidataConfig.entities

const {
  CARBON_FOOTPRINT,
  START_TIME,
  END_TIME,
  DETERMINATION_METHOD_OR_STANDARD,
  REFERENCE_URL,
  OBJECT_OF_STATEMENT_HAS_ROLE,
  APPLIES_TO_PART,
  ARCHIVE_URL,
} = wikidataConfig.properties

export async function editEntity(
  entity: ItemId,
  claims: Claim[],
  removeClaim: RemoveClaim[]
) {
  if (claims.length === 0 && removeClaim.length === 0) {
    return
  }
  const wbEdit = WBEdit(wikibaseEditConfig)
  const claimBody = claims.map((claim) => {
    const claimObject = {
      value: {
        amount: claim.value,
        unit: TONNE_OF_CARBON_DIOXIDE_EQUIVALENT,
      },
      qualifiers: {
        [START_TIME]: claim.startDate,
        [END_TIME]: claim.endDate,
        [DETERMINATION_METHOD_OR_STANDARD]: GHG_PROTOCOL,
      },
      references: [
        {
          [REFERENCE_URL]: claim.referenceUrl,
          [ARCHIVE_URL]: claim.archiveUrl,
        },
      ],
    }

    if (claim.scope !== undefined) {
      claimObject.qualifiers[OBJECT_OF_STATEMENT_HAS_ROLE] = claim.scope
    }

    if (claim.category !== undefined) {
      claimObject.qualifiers[APPLIES_TO_PART] = claim.category
    }

    return claimObject
  })

  const body = {
    id: entity,
    claims: {
      [CARBON_FOOTPRINT]: [...claimBody, ...removeClaim],
    },
    summary: 'Added/Updated carbon footprint data',
  }
  // Dry Run
  console.log(`Would edit entity ${entity} with:`, JSON.stringify(body, null, 2));
  console.log(`Claims to add: ${claims.length}, Claims to remove: ${removeClaim.length}`);
  
  // Comment out to prevent direct changes
  // try {
  //   const res = await wbEdit.entity.edit(body);
  // } catch(error) {
  //   console.log(`Could not update entity ${entity}: ${error}`);
  // }
}
/**
 * Calculates the claims to add and which to remove in order to update the entity
 * @param claims The claims to add
 * @param existingClaims The claims that are already on the entity
 * @returns
 */
async function diffCarbonFootprintClaims(
  claims: Claim[],
  existingClaims: Claim[]
) {
  const newClaims: Claim[] = []
  const rmClaims: RemoveClaim[] = []

  for (const claim of claims) {
    let duplicate = false
    for (const existingClaim of existingClaims) {
      /**
       * Bit of explanaiton for the different cases
       * The compareClaim function looks if there is already a claim with the same scope and optional category
       * If that is the case we only want the most recent claim of that scope and category to be on wikidata
       * Therefore, we look at the end date of the claim's reporting period to find the most recent one
       * All older claims will not be added or are removed if there are on wikidata
       */
      if (compareClaims(claim, existingClaim)) {
        if (compareDateStrings(existingClaim.endDate, claim.endDate) < 0) {
          if (existingClaim.id !== undefined) {
            //We dont want to remove any claims for now
            //rmClaims.push({id: existingClaim.id, remove: true});  //Remove older claims;
          }
          continue
        } else if (
          compareDateStrings(existingClaim.endDate, claim.endDate) > 0
        ) {
          duplicate = true //If there is a more recent one do not add that claim
        } else if (
          compareDateStrings(existingClaim.endDate, claim.endDate) === 0 &&
          compareDateStrings(existingClaim.startDate, claim.startDate) === 0
        ) {
          if ('+' + claim.value !== existingClaim.value) {
            newClaims.push(claim) //Update value by removing old claim and adding new claim
            if (existingClaim.id !== undefined) {
              rmClaims.push({ id: existingClaim.id, remove: true })
            }
          }
          duplicate = true
        } else {
          newClaims.push(claim) //if for some reason the start times differ we still opt for our claim
          if (existingClaim.id !== undefined) {
            rmClaims.push({ id: existingClaim.id, remove: true })
          }
          duplicate = true
        }
      }
    }
    if (!duplicate) {
      newClaims.push(claim) //only add claims that not exist already
    }
  }
  return { newClaims, rmClaims }
}

export function removeExistingDuplicates(existingClaims: Claim[], rmClaims: RemoveClaim[]) {
  for(const existingClaim of existingClaims) {
    if(!rmClaims.find((claimI) => claimI.id === existingClaim.id)) {
      const duplicate = existingClaims.find(
        (claimI) => 
        compareClaims(existingClaim, claimI) 
        && existingClaim.startDate === claimI.startDate
        && existingClaim.endDate === claimI.endDate
        && claimI.id !== existingClaim.id 
        && !rmClaims.find((claimR) => claimI.id === claimR.id));
      if(duplicate && existingClaim.id !== undefined) {
        rmClaims.push({id: existingClaim.id, remove: true});
      }
    }
  }
  return {rmClaims};
}

export function removeZeroValueClaims(existingClaims: Claim[], rmClaims: RemoveClaim[]) {
  for(const existingClaim of existingClaims) {
    // Check if this claim is already marked for removal
    if(rmClaims.find((claimI) => claimI.id === existingClaim.id)) {
      continue;
    }
    
    // Check if this is a 0-value scope 3 claim that should be removed
    const value = existingClaim.value.startsWith('+') ? existingClaim.value.substring(1) : existingClaim.value;
    const isZeroValueScope3 = value === '0' && existingClaim.scope === SCOPE_3 && existingClaim.category !== undefined;
    
    if(isZeroValueScope3 && existingClaim.id !== undefined) {
      console.log(`Marking 0-value scope 3 claim for removal: Category ${existingClaim.category}, Period ${existingClaim.startDate} to ${existingClaim.endDate}, ID: ${existingClaim.id}`);
      rmClaims.push({id: existingClaim.id, remove: true});
    }
  }
  return {rmClaims};
}

export async function diffTotalCarbonFootprintClaims(
  newClaims: Claim[],
  existingClaims: Claim[],
  rmClaims: RemoveClaim[]
) {
  // Get claims from the most recent reporting period
  const mostRecentClaims = reduceToMostRecentClaims([
    ...newClaims,
    ...existingClaims,
  ], rmClaims);

  if (mostRecentClaims.length === 0) {
    return { newClaims, rmClaims };
  }

  // Calculate total emissions for all scopes
  const total = calculateTotalEmissions(mostRecentClaims);

  // Calculate total scope 3 emissions (with categories)
  const totalScope3 = calculateTotalScope3Emissions(mostRecentClaims);

  const mostRecentDate = {
    startDate: mostRecentClaims[0].startDate,
    endDate: mostRecentClaims[0].endDate,
    archiveUrl: mostRecentClaims[0].archiveUrl,
    referenceUrl: mostRecentClaims[0].referenceUrl,
  };

  // Handle total emissions claim
  const shouldUpdateTotalClaim = shouldUpdateClaim(
    existingClaims,
    mostRecentDate.endDate,
    total,
    undefined,
    undefined,
    rmClaims
  );

  if (shouldUpdateTotalClaim) {
      newClaims.push({
      ...mostRecentDate,
        value: total.toString(),
    });
    }

  // Handle total scope 3 emissions claim
  const shouldUpdateScope3Claim = shouldUpdateClaim(
    existingClaims,
    mostRecentDate.endDate,
    totalScope3,
    SCOPE_3,
    undefined,
    rmClaims
  );

  if (shouldUpdateScope3Claim) {
      newClaims.push({
      ...mostRecentDate,
        scope: SCOPE_3,
      value: totalScope3.toString(),
    });
    }

  return { newClaims, rmClaims };
}

function calculateTotalEmissions(claims: Claim[]): number {
  return claims.reduce((total: number, current) => {
    if (!current.scope) return total;

    // Skip certain claims based on conditions
    if (shouldSkipClaimForTotal(current, claims)) {
      return total;
    }

    return total + parseClaimValue(current.value);
  }, 0);
}

function calculateTotalScope3Emissions(claims: Claim[]): number {
  return claims.reduce((total: number, current) => {
    if (current.scope === SCOPE_3 && current.category !== undefined) {
      return total + parseClaimValue(current.value);
    }
    return total;
  }, 0);
}

function parseClaimValue(value: string): number {
  if (typeof value !== 'number' && value.startsWith('+')) {
    return parseInt(value.substring(1));
  }
  return parseInt(value);
}

function shouldSkipClaimForTotal(claim: Claim, allClaims: Claim[]): boolean {
  if (claim.scope === SCOPE_3 && claim.category === undefined &&
      allClaims.some(c => c.scope === SCOPE_3 && c.category !== undefined)) {
    return true;
  }

  if (claim.scope === SCOPE_2_LOCATION_BASED &&
      allClaims.some(c => c.scope === SCOPE_2_MARKET_BASED)) {
    return true;
  }

  if (claim.scope === SCOPE_2 &&
      allClaims.some(c => c.scope === SCOPE_2_MARKET_BASED || c.scope === SCOPE_2_LOCATION_BASED)) {
    return true;
  }

  return false;
}

function shouldUpdateClaim(
  existingClaims: Claim[],
  mostRecentEndDate: string,
  totalValue: number,
  scope?: ItemId,
  category?: ItemId,
  rmClaims: RemoveClaim[] = []
): boolean {
  for (const claim of existingClaims) {
    // Normalize empty strings and undefined for comparison
    const normalizeValue = (val: any) => val === '' || val === undefined || val === null ? undefined : val;
    const normalizedClaimScope = normalizeValue(claim.scope);
    const normalizedClaimCategory = normalizeValue(claim.category);
    const normalizedScope = normalizeValue(scope);
    const normalizedCategory = normalizeValue(category);

    const isMatchingClaim = normalizedClaimScope === normalizedScope && normalizedClaimCategory === normalizedCategory;

    if (isMatchingClaim) {
      if (claim.endDate === mostRecentEndDate) {
        if (claim.value !== '+' + totalValue && claim.id) {
          rmClaims.push({ id: claim.id, remove: true });
        } else {
          return false;
        }
      }
    }
  }
  return true;
}

export function reduceToMostRecentClaims(claims: Claim[], rmClaims: RemoveClaim[] = []): Claim[] {
  return claims.reduce((recentClaims: Claim[], current) => {
    if (
      current.id === undefined || //Always check for new claim
      !rmClaims.find((claimI) => claimI.id === current.id) //Always check for existing claims that will not be removed
    ) {
      if (
        recentClaims.length === 0 || //If we have not yet initalized a most recent claim or the current claim has a more recent end date
        current.endDate > recentClaims[0].endDate
      ) {
        recentClaims = [current] // We override our set with most recent claims
      } else if (current.endDate === recentClaims[0].endDate) { //Otherwise if the current claim is as recent as our set of most recent claims
        recentClaims.push(current) //We add the claim to the set
      }
    }
    return recentClaims
  }, []);
}


export async function bulkCreateOrEditCarbonFootprintClaim(
  entity: ItemId,
  claims: Claim[]
) {
  try {    
    const existingClaims = await getClaims(entity);
    let { newClaims, rmClaims } = await diffCarbonFootprintClaims(
      claims,
      existingClaims
    );
    ({ newClaims, rmClaims } = await diffTotalCarbonFootprintClaims(
      newClaims,
      existingClaims,
      rmClaims
    ));
    ({rmClaims} = removeExistingDuplicates(existingClaims, rmClaims));
    ({rmClaims} = removeZeroValueClaims(existingClaims, rmClaims));
    if (newClaims.length > 0 || rmClaims.length > 0) {
      await editEntity(entity, newClaims, rmClaims)
      console.log(`Updated ${entity}`)
    }
  } catch (error) {console.error(error)}
}