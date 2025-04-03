import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { bulkCreateOrEditCarbonFootprintClaim, Claim, reduceToMostRecentClaims, transformEmissionsToClaims } from '../lib/wikidata'

export class WikidataUploadJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidata: { node: `Q${number}` }
    body?: any
  }
}

const wikidataUpload = new DiscordWorker<WikidataUploadJob>(
  'wikidataUpload',
  async (job) => {
    const {
      wikidata,
      body
    } = job.data
    
    const allClaims: Claim[] = [];
    body.reportingPeriods.forEach(reportingPeriod => {
        const startDate = (new Date(reportingPeriod.startDate)).toISOString();
        const endDate = (new Date(reportingPeriod.endDate)).toISOString();
        const referenceUrl = reportingPeriod.reportURL;
        if(reportingPeriod.emissions !== undefined) {
            allClaims.push(...transformEmissionsToClaims(reportingPeriod.emissions, startDate, endDate, referenceUrl));
        }
    });

    const uniqueClaimSet = reduceToMostRecentClaims(allClaims);

    bulkCreateOrEditCarbonFootprintClaim(wikidata.node, uniqueClaimSet);

    return { success: true }
  }
)

export default wikidataUpload
