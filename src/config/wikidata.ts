import 'dotenv/config'
import { number, z } from 'zod'

const envSchema = z.object({
    WIKIDATA_URL: z.string().default('https://www.wikidata.org'),
})

const env = envSchema.parse(process.env)

interface WikidataProperties {
    CARBON_FOOTPRINT: string,
    START_TIME: string,
    END_TIME: string,
    DETERMINATION_METHOD_OR_STANDARD: string,
    REFERENCE_URL: string,
    OBJECT_OF_STATEMENT_HAS_ROLE: string,
    APPLIES_TO_PART: string
}

interface WikidataEntities {
    TONNE_OF_CARBON_DIOXIDE_EQUIVALENT: `Q${number}`,
    GHG_PROTOCOL: `Q${number}`,
    SCOPE_1: `Q${number}`,
    SCOPE_2: `Q${number}`,
    SCOPE_2_MARKET_BASED: `Q${number}`,
    SCOPE_2_LOCATION_BASED: `Q${number}`,
    SCOPE_3: `Q${number}`,
    PURCHASED_GOODS_AND_SERVICES: `Q${number}`,
    CAPITAL_GOODS: `Q${number}`,
    FUEL_AND_ENERGY_RELATED_ACTIVITIES: `Q${number}`,
    UPSTREAM_TRANSPORTATION_AND_DISTRIBUTION: `Q${number}`,
    WASTE_GENERATED_IN_OPERATIONS: `Q${number}`,
    BUSINESS_TRAVEL: `Q${number}`,
    EMPLOYEE_COMMUTING: `Q${number}`,
    UPSTREAM_LEASED_ASSETS: `Q${number}`,
    DOWNSTREAM_TRANSPORTATION_AND_DISTRIBUTION: `Q${number}`,
    PROCESSING_OF_SOLID_PRODUCTS: `Q${number}`,
    USE_OF_SOLD_PRODUCTS: `Q${number}`,
    END_OF_LIFE_TREATMENT_OF_SOLD_PRODUCTS: `Q${number}`,
    DOWNSTREAM_LEASED_ASSETS: `Q${number}`,
    FRANCHISES: `Q${number}`,
    INVESTMENTS: `Q${number}`,
}

const LiveWikidataProperties: WikidataProperties = {
    CARBON_FOOTPRINT: "P5991",
    START_TIME: "P580",
    END_TIME: "P582",
    DETERMINATION_METHOD_OR_STANDARD: "P459",
    REFERENCE_URL: "P854",
    OBJECT_OF_STATEMENT_HAS_ROLE: "P3831",
    APPLIES_TO_PART: "P518"
} as const

const TestWikidataProperties: WikidataProperties = {
    CARBON_FOOTPRINT: "P98845",
    START_TIME: "P355",
    END_TIME: "P356",
    DETERMINATION_METHOD_OR_STANDARD: "P98847",
    REFERENCE_URL: "P93",
    OBJECT_OF_STATEMENT_HAS_ROLE: "P98849",
    APPLIES_TO_PART: "P822"
} as const

const LiveWikidataEntities : WikidataEntities = {
    TONNE_OF_CARBON_DIOXIDE_EQUIVALENT: "Q57084755",
    GHG_PROTOCOL: "Q56296245",
    SCOPE_1: "Q124883250",
    SCOPE_2: "Q124883301",
    SCOPE_2_MARKET_BASED: "Q124883330",
    SCOPE_2_LOCATION_BASED: "Q124883327",
    SCOPE_3: "Q124883309",
    PURCHASED_GOODS_AND_SERVICES: "Q124883638",
    CAPITAL_GOODS: "Q124883639",
    FUEL_AND_ENERGY_RELATED_ACTIVITIES: "Q124883640",
    UPSTREAM_TRANSPORTATION_AND_DISTRIBUTION: "Q124883642",
    WASTE_GENERATED_IN_OPERATIONS: "Q124883643",
    BUSINESS_TRAVEL: "Q124883644",
    EMPLOYEE_COMMUTING: "Q124883646",
    UPSTREAM_LEASED_ASSETS: "Q124883647",
    DOWNSTREAM_TRANSPORTATION_AND_DISTRIBUTION: "Q124883648",
    PROCESSING_OF_SOLID_PRODUCTS: "Q124883649",
    USE_OF_SOLD_PRODUCTS: "Q124883650",
    END_OF_LIFE_TREATMENT_OF_SOLD_PRODUCTS: "Q124883651",
    DOWNSTREAM_LEASED_ASSETS: "Q124883652",
    FRANCHISES: "Q124883653",
    INVESTMENTS: "Q124883654",
} as const

const TestWikidataEntities : WikidataEntities = {
    TONNE_OF_CARBON_DIOXIDE_EQUIVALENT: "Q238307",
    GHG_PROTOCOL: "Q238313",
    SCOPE_1: "Q238314",
    SCOPE_2: "Q238329",
    SCOPE_2_MARKET_BASED: "Q238315",
    SCOPE_2_LOCATION_BASED: "Q238316",
    SCOPE_3: "Q238317",
    PURCHASED_GOODS_AND_SERVICES: "Q238318", //we don't created every category in the sandbox, therefore for tests we just alternate between the first two
    CAPITAL_GOODS: "Q238319",
    FUEL_AND_ENERGY_RELATED_ACTIVITIES: "Q238318",
    UPSTREAM_TRANSPORTATION_AND_DISTRIBUTION: "Q238319",
    WASTE_GENERATED_IN_OPERATIONS: "Q238318",
    BUSINESS_TRAVEL: "Q238319",
    EMPLOYEE_COMMUTING: "Q238318",
    UPSTREAM_LEASED_ASSETS: "Q238319",
    DOWNSTREAM_TRANSPORTATION_AND_DISTRIBUTION: "Q238318",
    PROCESSING_OF_SOLID_PRODUCTS: "Q238319",
    USE_OF_SOLD_PRODUCTS: "Q238318",
    END_OF_LIFE_TREATMENT_OF_SOLD_PRODUCTS: "Q238319",
    DOWNSTREAM_LEASED_ASSETS: "Q238318",
    FRANCHISES: "Q238319",
    INVESTMENTS: "Q238318",
} as const

const translateIdToCategory = (entities: WikidataEntities, id: number) => {
    if(id > 0 && id < 16) {
        //Last non category in the entities object has index 6
        return entities[Object.keys(entities)[id + 6]];
    }
    return undefined;
}

const wikidataConfig = {
    wikidataURL: env.WIKIDATA_URL,
    entities: env.WIKIDATA_URL === "https://www.wikidata.org" ? LiveWikidataEntities : TestWikidataEntities,
    properties: env.WIKIDATA_URL === "https://www.wikidata.org" ? LiveWikidataProperties : TestWikidataProperties,
    translateIdToCategory: (id) => translateIdToCategory(env.WIKIDATA_URL === "https://www.wikidata.org" ? LiveWikidataEntities : TestWikidataEntities, id)
} as const



export default wikidataConfig;