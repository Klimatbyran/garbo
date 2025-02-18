import 'dotenv/config'
import { z } from 'zod'

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
    TONNE_OF_CARBON_DIOXIDE_EQUIVALENT: string,
    GHG_PROTOCOL: string,
    SCOPE_1: string,
    SCOPE_2_MARKET_BASED: string,
    SCOPE_2_LOCATION_BASED: string,
    SCOPE_3: string,
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
    SCOPE_2_MARKET_BASED: "Q124883330",
    SCOPE_2_LOCATION_BASED: "Q124883327",
    SCOPE_3: "Q124883309",
} as const

const TestWikidataEntities : WikidataEntities = {
    TONNE_OF_CARBON_DIOXIDE_EQUIVALENT: "Q238307",
    GHG_PROTOCOL: "Q238313",
    SCOPE_1: "Q238214",
    SCOPE_2_MARKET_BASED: "Q238215",
    SCOPE_2_LOCATION_BASED: "Q238216",
    SCOPE_3: "Q238217",
} as const

const wikidataConfig = {
    wikidataURL: env.WIKIDATA_URL,
    entities: env.WIKIDATA_URL === "https://www.wikidata.org" ? LiveWikidataEntities : TestWikidataEntities,
    properties: env.WIKIDATA_URL === "https://www.wikidata.org" ? LiveWikidataProperties : TestWikidataProperties,
} as const

export default wikidataConfig;