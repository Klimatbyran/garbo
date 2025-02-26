import { ItemId } from "wikibase-sdk";
import { createClaim, createReference, getClaims, updateClaim, updateReference } from "../../lib/wikidata";
import wikidataConfig from "../../config/wikidata";

const {
  CARBON_FOOTPRINT,
  START_TIME,
  END_TIME,
  OBJECT_OF_STATEMENT_HAS_ROLE,
  APPLIES_TO_PART
} = wikidataConfig.properties;

class WikidataService {
  async updateWikidata(wikidataId: string) {
    //TODO: implement, only update the fields that diff from the existing data in wikidata
    console.log('WIP')
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

  async createOrEditCarbonFootprintClaim(entity: ItemId, startDate: string, endDate: string, value: string, referenceUrl: string, scope?: ItemId, category?: ItemId) {
    if(scope === undefined && category !== undefined) {
        throw new Error("Cannot have a category without a scope");
    }  
    const claim = await this.findCarbonFootprintClaim(entity, startDate, endDate, scope, category);
    console.log(claim);
    if(claim !== undefined) {
        const {guid, referenceHash} = claim;
      	await updateClaim(guid, value);
        if(referenceHash !== undefined) {
          await updateReference(guid, referenceUrl, referenceHash)
        } else {
          await createReference(guid, referenceUrl)
        }
    } else {
        await createClaim(entity, startDate, endDate, value, referenceUrl, scope, category);
    }
  }
}

export const wikidataService = new WikidataService()
