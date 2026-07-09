import { QUEUE_NAMES } from '../queues'

/** BullMQ queues spawned from precheck — contract tested in precheckFlow.test.ts */
export const PRECHECK_SIBLING_QUEUES = [
  QUEUE_NAMES.EXTRACT_EMISSIONS,
  QUEUE_NAMES.GUESS_WIKIDATA,
] as const

/** Children of extractEmissions only (guessWikidata must not be listed here). */
export const EXTRACT_EMISSIONS_CHILD_QUEUES = [
  QUEUE_NAMES.FOLLOW_UP_FISCAL_YEAR,
] as const
