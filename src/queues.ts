import { DiscordQueue } from './lib/DiscordQueue'

// Queue names as constants
export const QUEUE_NAMES = {
  NLM_PARSE_PDF: 'nlmParsePDF',
  DOCLING_PARSE_PDF: 'doclingParsePDF',
  NLM_EXTRACT_TABLES: 'nlmExtractTables',
  INDEX_MARKDOWN: 'indexMarkdown',
  PRECHECK: 'precheck',
  GUESS_WIKIDATA: 'guessWikidata',
  FOLLOW_UP: 'followUp',
  EXTRACT_DESCRIPTIONS: 'extractDescriptions',
  EXTRACT_EMISSIONS: 'extractEmissions',
  CHECK_DB: 'checkDB',
  DIFF_BASE_YEAR: 'diffBaseYear',
  DIFF_GOALS: 'diffGoals',
  DIFF_INDUSTRY: 'diffIndustry',
  DIFF_INITIATIVES: 'diffInitiatives',
  DIFF_REPORTING_PERIODS: 'diffReportingPeriods',
  DIFF_TAGS: 'diffTags',
  DIFF_DESCRIPTIONS: 'diffDescriptions',
  SAVE_TO_API: 'saveToAPI',
  SEND_COMPANY_LINK: 'sendCompanyLink',
  WIKIPEDIA_UPLOAD: 'wikipediaUpload',
  EXTRACT_LEI: 'extractLEI',
  DIFF_LEI: 'diffLEI',
}

// Create queue clients (NOT workers)
export const queues = {
  nlmParsePDF: new DiscordQueue(QUEUE_NAMES.NLM_PARSE_PDF),
  doclingParsePDF: new DiscordQueue(QUEUE_NAMES.DOCLING_PARSE_PDF),
  indexMarkdown: new DiscordQueue(QUEUE_NAMES.INDEX_MARKDOWN),
  nlmExtractTables: new DiscordQueue(QUEUE_NAMES.NLM_EXTRACT_TABLES),
  precheck: new DiscordQueue(QUEUE_NAMES.PRECHECK),
  checkDB: new DiscordQueue(QUEUE_NAMES.CHECK_DB),
  diffBaseYear: new DiscordQueue(QUEUE_NAMES.DIFF_BASE_YEAR),
  diffGoals: new DiscordQueue(QUEUE_NAMES.DIFF_GOALS),
  diffIndustry: new DiscordQueue(QUEUE_NAMES.DIFF_INDUSTRY),
  diffInitiatives: new DiscordQueue(QUEUE_NAMES.DIFF_INITIATIVES),
  diffReportingPeriods: new DiscordQueue(QUEUE_NAMES.DIFF_REPORTING_PERIODS),
  diffDescriptions: new DiscordQueue(QUEUE_NAMES.DIFF_DESCRIPTIONS),
  diffTags: new DiscordQueue(QUEUE_NAMES.DIFF_TAGS),
  extractEmissions: new DiscordQueue(QUEUE_NAMES.EXTRACT_EMISSIONS),
  followUp: new DiscordQueue(QUEUE_NAMES.FOLLOW_UP),
  extractDescriptions: new DiscordQueue(QUEUE_NAMES.EXTRACT_DESCRIPTIONS),
  guessWikidata: new DiscordQueue(QUEUE_NAMES.GUESS_WIKIDATA),
  saveToAPI: new DiscordQueue(QUEUE_NAMES.SAVE_TO_API),
  sendCompanyLink: new DiscordQueue(QUEUE_NAMES.SEND_COMPANY_LINK),
  wikipediaUpload: new DiscordQueue(QUEUE_NAMES.WIKIPEDIA_UPLOAD),
  extractLEI: new DiscordQueue(QUEUE_NAMES.EXTRACT_LEI),
  diffLEI: new DiscordQueue(QUEUE_NAMES.DIFF_LEI),

}
