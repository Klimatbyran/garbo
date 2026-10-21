import { PipelineQueue } from './lib/PipelineQueue'
import { QUEUE_NAMES } from './queueNames'

export { QUEUE_NAMES }

export const queues = {
  parsePdf: new PipelineQueue(QUEUE_NAMES.PARSE_PDF),
  doclingParsePDF: new PipelineQueue(QUEUE_NAMES.DOCLING_PARSE_PDF),
  indexMarkdown: new PipelineQueue(QUEUE_NAMES.INDEX_MARKDOWN),
  checkEmissionsPresence: new PipelineQueue(
    QUEUE_NAMES.CHECK_EMISSIONS_PRESENCE
  ),
  precheck: new PipelineQueue(QUEUE_NAMES.PRECHECK),
  checkDB: new PipelineQueue(QUEUE_NAMES.CHECK_DB),
  diffBaseYear: new PipelineQueue(QUEUE_NAMES.DIFF_BASE_YEAR),
  diffGoals: new PipelineQueue(QUEUE_NAMES.DIFF_GOALS),
  diffIndustry: new PipelineQueue(QUEUE_NAMES.DIFF_INDUSTRY),
  diffInitiatives: new PipelineQueue(QUEUE_NAMES.DIFF_INITIATIVES),
  diffReportingPeriods: new PipelineQueue(QUEUE_NAMES.DIFF_REPORTING_PERIODS),
  diffDescriptions: new PipelineQueue(QUEUE_NAMES.DIFF_DESCRIPTIONS),
  diffTags: new PipelineQueue(QUEUE_NAMES.DIFF_TAGS),
  diffReportType: new PipelineQueue(QUEUE_NAMES.DIFF_REPORT_TYPE),
  extractEmissions: new PipelineQueue(QUEUE_NAMES.EXTRACT_EMISSIONS),
  followUpScope1: new PipelineQueue(QUEUE_NAMES.FOLLOW_UP_SCOPE_1),
  followUpScope2: new PipelineQueue(QUEUE_NAMES.FOLLOW_UP_SCOPE_2),
  followUpScope12: new PipelineQueue(QUEUE_NAMES.FOLLOW_UP_SCOPE_12),
  followUpScope3: new PipelineQueue(QUEUE_NAMES.FOLLOW_UP_SCOPE_3),
  followUpBiogenic: new PipelineQueue(QUEUE_NAMES.FOLLOW_UP_BIOGENIC),
  followUpInitiatives: new PipelineQueue(QUEUE_NAMES.FOLLOW_UP_INITIATIVES),
  followUpCompanyTags: new PipelineQueue(QUEUE_NAMES.FOLLOW_UP_COMPANY_TAGS),
  followUpReportType: new PipelineQueue(QUEUE_NAMES.FOLLOW_UP_REPORT_TYPE),
  followUpGoals: new PipelineQueue(QUEUE_NAMES.FOLLOW_UP_GOALS),
  followUpIndustryGics: new PipelineQueue(QUEUE_NAMES.FOLLOW_UP_INDUSTRY_GICS),
  followUpBaseYear: new PipelineQueue(QUEUE_NAMES.FOLLOW_UP_BASE_YEAR),
  followUpEconomy: new PipelineQueue(QUEUE_NAMES.FOLLOW_UP_ECONOMY),
  followUpFiscalYear: new PipelineQueue(QUEUE_NAMES.FOLLOW_UP_FISCAL_YEAR),
  extractDescriptions: new PipelineQueue(QUEUE_NAMES.EXTRACT_DESCRIPTIONS),
  guessWikidata: new PipelineQueue(QUEUE_NAMES.GUESS_WIKIDATA),
  saveToAPI: new PipelineQueue(QUEUE_NAMES.SAVE_TO_API),
  sendCompanyLink: new PipelineQueue(QUEUE_NAMES.SEND_COMPANY_LINK),
  wikipediaUpload: new PipelineQueue(QUEUE_NAMES.WIKIPEDIA_UPLOAD),
  extractLEI: new PipelineQueue(QUEUE_NAMES.EXTRACT_LEI),
  diffLEI: new PipelineQueue(QUEUE_NAMES.DIFF_LEI),
  extractGleifIds: new PipelineQueue(QUEUE_NAMES.EXTRACT_GLEIF_IDS),
  diffGleifIds: new PipelineQueue(QUEUE_NAMES.DIFF_GLEIF_IDS),
  followUpReportingQuality: new PipelineQueue(
    QUEUE_NAMES.FOLLOW_UP_REPORTING_QUALITY
  ),
  diffReportingQuality: new PipelineQueue(QUEUE_NAMES.DIFF_REPORTING_QUALITY),
}
