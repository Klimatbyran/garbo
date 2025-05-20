
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker';
import {  fetchLEIFromWikidata} from '../lib/wikidata'; 
import { QUEUE_NAMES } from '../queues';

export class LEIJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string;
    wikidataId: string; 
    
  };
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
    job.log(`✅ Found LEI for '${companyName}': ${leiData.lei}`);
    return { lei: leiData.lei, wikidataId: leiData.wikidataId };
    
  }
);

export default extractLEI;

