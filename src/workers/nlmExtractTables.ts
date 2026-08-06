// ! Commented out until we have decided how to handle screenshots and table extraction
// import { UnrecoverableError } from 'bullmq'
// import { PipelineJob, PipelineWorker } from '../lib/PipelineWorker'
// import { ParsedDocument } from '../lib/nlm-ingestor-schema'
// import { QUEUE_NAMES } from '../queues'
// import { createScreenshots } from '@/jobs/extractScreenshots/extractScreenshots'
// import { Logger } from '@/types'

// class NLMExtractTablesJob extends PipelineJob {
//   declare data: PipelineJob['data'] & {
//     json: ParsedDocument
//   }
// }

// const nlmExtractTables = new PipelineWorker(
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
