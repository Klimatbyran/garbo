import { PipelineJob } from './PipelineWorker'

export const createPipelineLogger = (job?: PipelineJob) => {
  if (!job) {
    return {
      info: (message: string) => console.log(`${message}`),
      error: (message: string) => console.error(`❌ ${message}`),
    }
  }
  return {
    info: async (message: string) => {
      await job.log(message)
    },
    error: async (message: string) => {
      await job.log(`ERROR: ${message}`)
    },
  }
}
