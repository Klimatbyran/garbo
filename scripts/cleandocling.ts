import redisConfig from '../src/config/redis'

console.log('Redis config in script:', redisConfig)

// 2) Now import queues (this will read the env above)
import { queues } from '../src/queues'
import { Queue } from 'bullmq'
import type { JobState } from 'bullmq'

async function clearDoclingWaitingAndActive() {
  const doclingQueue = new Queue('doclingParsePDF', {
    connection: {
      host: '127.0.0.1',
      port: 6379,
      password: '',
    },
  })
  const statuses: JobState[] = ['waiting', 'active']

  const jobs = await doclingQueue.getJobs(statuses)
  await Promise.all(jobs.map((job) => job.remove()))
  await doclingQueue.close()
}

clearDoclingWaitingAndActive().then(() => {
  console.log(
    'Cleared waiting/active jobs in doclingParsePDF on 127.0.0.1:6379'
  )
})
