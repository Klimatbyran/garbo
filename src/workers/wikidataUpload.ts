import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { bulkCreateOrEditCarbonFootprintClaim, Claim, reduceToMostRecentClaims, transformEmissionsToClaims } from '../lib/wikidata'

const KLIMATKOLLEN_ARCHIVE_PREFIX = "https://storage.googleapis.com/klimatkollen-pdfs/";
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
        const referenceUrl = reportingPeriod.reportURL.startsWith(KLIMATKOLLEN_ARCHIVE_PREFIX) ? undefined : reportingPeriod.reportURL;
        const archiveUrl = reportingPeriod.reportURL.startsWith(KLIMATKOLLEN_ARCHIVE_PREFIX) ? reportingPeriod.reportURL : undefined;
        if(reportingPeriod.emissions !== undefined) {
            allClaims.push(...transformEmissionsToClaims(reportingPeriod.emissions, startDate, endDate, referenceUrl, archiveUrl));
        }
    });

    const uniqueClaimSet = reduceToMostRecentClaims(allClaims);

    bulkCreateOrEditCarbonFootprintClaim(wikidata.node, uniqueClaimSet);

    return { success: true }
  }
)

export default wikidataUpload
