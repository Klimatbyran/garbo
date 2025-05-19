
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker';
import { getWikidataEntities, searchCompany } from '../lib/wikidata'; // Wikidata helpers
import { QUEUE_NAMES } from '../queues';

export class LEIJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string;
    wikidataId: string; // Wikidata entity ID.
    
  };
}

async function fetchLEIFromWikidata(companyName: string): Promise<{ lei?: string; wikidataId?: string } | null> {
  console.log(`🔍 Searching for '${companyName}' in Wikidata...`);

  const searchResults = await searchCompany({ companyName });
  if (!searchResults.length) {
    console.log(`⚠️ No Wikidata entry found for '${companyName}'.`);
    return null;
  }

  const entities = await getWikidataEntities(searchResults.map((result) => result.id));
  for (const entity of entities) {
    const claims = entity.claims || {};
    if (claims.P1278 && claims.P1278[0]?.mainsnak?.datavalue?.value) {
      const lei = claims.P1278[0].mainsnak.datavalue.value;
      console.log(`✅ Found LEI for '${companyName}': ${lei}`);
      return { lei, wikidataId: entity.id };
    }
  }

  console.log(`⚠️ No LEI found for '${companyName}' in Wikidata.`);
  
  return null;
}
const extractLEI = new DiscordWorker<LEIJob>(
  QUEUE_NAMES.EXTRACT_LEI,
  async (job: LEIJob) => {
    const { companyName } = job.data;

    
    const leiData = await fetchLEIFromWikidata(companyName);

    if (!leiData?.lei) {
      job.log(`❌ Could not find a valid LEI for '${companyName}' in Wikidata.`);
      throw new Error(`No LEI found for '${companyName}'.`);
    }
    
    job.log(`✅ Extracted LEI '${leiData.lei}' for '${companyName}' from Wikidata.`);
    console.log(`Extracted LEI for this company: ${leiData.lei}`);
    console.log(`Wikidata ID: ${leiData.wikidataId}`);
    
    return { lei: leiData.lei, wikidataId: leiData.wikidataId };
    
  }
);

export default extractLEI;

