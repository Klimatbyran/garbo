import { ItemId } from "wikibase-sdk";
import { Claim, createClaim, createReference, editClaim, getClaims, RemoveClaim, updateClaim, updateReference } from "../../lib/wikidata";
import wikidataConfig from "../../config/wikidata";
import { prisma } from '../../lib/prisma'
import { emissionsService } from "./emissionsService";
import { Emissions } from "@prisma/client";

const {
  CARBON_FOOTPRINT,
  START_TIME,
  END_TIME,
  OBJECT_OF_STATEMENT_HAS_ROLE,
  APPLIES_TO_PART
} = wikidataConfig.properties;

class WikidataService {
  async updateWikidata(wikidataId: `Q${number}`) {
    let claims: Claim[] = [];
    const emissions: Emissions = await emissionsService.getLatestEmissionsAndMetadataByWikidataId(wikidataId)
    const startDate = emissions.reportingPeriod.startDate
    const endDate = emissions.reportingPeriod.endDate
    const reportURL = emissions.reportingPeriodId.reportURL

    if (!startDate || !endDate) return

    if(
      emissions.scope1?.metadata.verifiedBy &&
      emissions.scope1?.total &&
      emissions.scope1?.unit
    ) {
      claims.push({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          value: emissions.scope1.total!.toString(),
          referenceUrl: reportURL!,
          scope: wikidataConfig.entities.SCOPE_1
      })
      console.log("Scope 1 Done")
    }

    if(
      emissions.scope2?.metadata.verifiedBy &&
      emissions.scope2?.total &&
      emissions.scope2?.unit
    ) {
        if(emissions.scope2.mb) {
            claims.push({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                value: emissions.scope2.mb!.toString(),
                referenceUrl: reportURL!,
                scope: wikidataConfig.entities.SCOPE_2_MARKET_BASED
            }) 
            console.log("Scope 2 mb Done")
        }

        if(emissions.scope2.lb) {
            claims.push({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                value: emissions.scope2.lb!.toString(),
                referenceUrl: reportURL!,
                scope: wikidataConfig.entities.SCOPE_2_LOCATION_BASED
            })
            console.log("Scope 2 lb Done")
        }

        if(emissions.scope2.unknown) {
            claims.push({
                startDate: emissions!.scope2.reportingPeriod!.startDate.toISOString(),
                endDate: emissions!.scope2.reportingPeriod!.endDate.toISOString(),
                value: emissions.scope2.unknown!.toString(),
                referenceUrl: emissions!.scope2.reportingPeriod!.reportURL!,
                scope: wikidataConfig.entities.SCOPE_2
            })
            console.log("Scope 2 unknown Done")
        }
    }

    for(const category of emissions.scope3.categories) {
        if(category.metadata.verifiedBy && category && category.unit && category.total && category.category !== 16) {
            claims.push({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                value: emissions.statedTotalEmissions.total!.toString(),
                referenceUrl: reportURL!,
                scope: wikidataConfig.entities.SCOPE_3,
                category: wikidataConfig.translateIdToCategory(category.category)
            })
            console.log("Scope 3 category Done")
        }
    }
    await wikidataService.bulkCreateOrEditCarbonFootprintClaim(wikidataId, claims);
    return
  }

  async findCarbonFootprintClaim(entity: ItemId, startDate: string, endDate: string, scope?: string, category?: string): Promise<{guid: string, referenceHash?: string}|undefined> {
    
    const {entities} = await getClaims(entity);
  
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

  compareClaims(newClaim, wikiDataClaim) { 
    const qualifiers = wikiDataClaim.qualifiers;
    if(qualifiers[START_TIME] === undefined || qualifiers[START_TIME][0].datavalue.value.time !== this.transformToWikidataDateString(new Date(newClaim.startDate))) {
      return false;
    }

    if(qualifiers[END_TIME] === undefined || qualifiers[END_TIME][0].datavalue.value.time !== this.transformToWikidataDateString(new Date(newClaim.endDate))) {
        return false;
    }
    
    if( (newClaim.scope === undefined && qualifiers[OBJECT_OF_STATEMENT_HAS_ROLE] !== undefined) ||
        (newClaim.scope !== undefined && (qualifiers[OBJECT_OF_STATEMENT_HAS_ROLE] === undefined || qualifiers[OBJECT_OF_STATEMENT_HAS_ROLE][0].datavalue.value.id !== newClaim.scope))) {
        return false;
    }
    if( (newClaim.category === undefined && qualifiers[APPLIES_TO_PART] !== undefined) ||
        (newClaim.category !== undefined && (qualifiers[APPLIES_TO_PART] === undefined || qualifiers[APPLIES_TO_PART][0].datavalue.value.id !== newClaim.category))) {
        return false;
    }
    return true;
  }

  async diffCarbonFootprintClaims(entity: ItemId, claims: Claim[]) {
    const {entities} = await getClaims(entity);
    const newClaims: Claim[] = [];
    const rmClaims: RemoveClaim[] = [];
    
    const existingClaims = entities[entity].claims ? entities[entity].claims[CARBON_FOOTPRINT] ?? [] : [];

    for(const claim of claims) {
      let duplicate = false;
      for(const existingClaim of existingClaims) {
        if(this.compareClaims(claim, existingClaim)) {
          if(("+" + claim.value) !== existingClaim.mainsnak.datavalue.value.amount) {
            newClaims.push(claim);
            rmClaims.push({id: existingClaim.id, remove: true});
          }          
          duplicate = true;
          break;
        }      
      }
      if(!duplicate) {
        newClaims.push(claim);
      }
    }

    return {newClaims, rmClaims};
  }

  async bulkCreateOrEditCarbonFootprintClaim(entity: ItemId, claims: Claim[]) {
    const {newClaims, rmClaims} = await this.diffCarbonFootprintClaims(entity, claims);  
    await editClaim(entity, newClaims, rmClaims);
  }

  async createOrEditCarbonFootprintClaim(entity: ItemId, startDate: Date, endDate: Date, value: string, referenceUrl: string, scope?: ItemId, category?: ItemId) {
    if(scope === undefined && category !== undefined) {
        throw new Error("Cannot have a category without a scope");
    }  
    const claim = await this.findCarbonFootprintClaim(entity, this.transformToWikidataDateString(startDate), this.transformToWikidataDateString(endDate),
    scope, category);
    if(claim !== undefined) {
        const {guid, referenceHash} = claim;
      	await updateClaim(guid, value);
        if(referenceHash !== undefined) {
          await updateReference(guid, referenceUrl, referenceHash)
        } else {
          await createReference(guid, referenceUrl)
        }
    } else {
        await createClaim(entity, startDate.toISOString(), endDate.toISOString(), value, referenceUrl, scope, category);
    }
  }
  
  transformToWikidataDateString(date: Date) {
    return "+" + date.toISOString().substring(0, 19) + "Z";
  }
}

export const wikidataService = new WikidataService()
