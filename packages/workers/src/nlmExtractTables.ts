// ! Commented out until we have decided how to handle screenshots and table extraction
// import { UnrecoverableError } from 'bullmq'
// import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
// import { ParsedDocument } from '../lib/nlm-ingestor-schema'
// import { QUEUE_NAMES } from '../queues'
// import { createScreenshots } from '@/jobs/extractScreenshots/extractScreenshots'
// import { Logger } from '@garbo/api/src/types'

// class NLMExtractTablesJob extends DiscordJob {
//   declare data: DiscordJob['data'] & {
//     json: ParsedDocument
//   }
// }

// const nlmExtractTables = new DiscordWorker(
//   QUEUE_NAMES.NLM_EXTRACT_TABLES,
//   async (job: NLMExtractTablesJob, logger: Logger) => {
//     const { json, url } = job.data
//     try {
//       await createScreenshots(json, url, logger)
//     } catch (error) {
//       logger.error(
//         `Error in ${QUEUE_NAMES.NLM_EXTRACT_TABLES}: ${error.message}`,
//       )
//       throw new UnrecoverableError(
//         `Error in ${QUEUE_NAMES.NLM_EXTRACT_TABLES}: ${error.message}`,
//       )
//     }
//   },
// )

// export default nlmExtractTables
