import discord from './discord'
import { workers } from './workers'
import googleSearchPDFs from './workers/googleSearchPDFs'
import { Queue } from 'bullmq'
import { QUEUE_NAMES } from './queues'
import redis from './config/redis'
import googleConfig from './config/google'

console.log('Starting workers...')

Promise.all(workers.map((worker) => worker.run()))
  .then((results) => results.join('\n'))
  .then(console.log)
  .catch((error) => {
    console.error('Error starting workers:', error)
    process.exit(1)
  })

// Schedule daily Google search for new sustainability reports
async function scheduleGoogleSearchJob() {
  // Only schedule if Google API is configured
  if (!googleConfig.isConfigured) {
    console.warn(
      'Google API not configured. Skipping PDF search job scheduling.'
    )
    return
  }

  const queue = new Queue(QUEUE_NAMES.GOOGLE_SEARCH_PDFS, { connection: redis })

  // Check if job already exists
  const repeatableJobs = await queue.getJobs()
  const jobExists = repeatableJobs.some(
    (job) => job.name === 'daily-sustainability-report-search'
  )

  if (!jobExists) {
    // Add recurring job to run daily at 2 AM with a consistent job ID
    await queue.add(
      'daily-sustainability-report-search',
      {
        searchQuery: 'hållbarhetsrapport 2024 filetype:pdf',
        jobId: 'daily-sustainability-report-search',
      },
      {
        jobId: 'daily-sustainability-report-search',
        repeat: {
          pattern: '0 2 * * *', // Cron pattern: At 02:00 every day
        },
      }
    )

    console.log('✅ Scheduled daily Google search for sustainability reports')
  } else {
    console.log('✅ Daily Google search job already scheduled')
  }

  // Add a one-time test job if requested
  if (process.env.RUN_SEARCH_TEST === 'true') {
    // Check if test job is already in the queue
    const jobs = await queue.getJobs(['waiting', 'active', 'delayed'])
    const testJobExists = jobs.some(
      (job) => job.name === 'test-sustainability-report-search'
    )

    if (!testJobExists) {
      await queue.add(
        'test-sustainability-report-search',
        {
          searchQuery: 'hållbarhetsrapport 2024 filetype:pdf',
          threadId: process.env.TEST_THREAD_ID || '0',
          channelId: process.env.TEST_CHANNEL_ID || '0',
          jobId: 'test-sustainability-report-search',
        },
        {
          jobId: 'test-sustainability-report-search',
        }
      )
      console.log('✅ Added test Google search job')
    } else {
      console.log('✅ Test Google search job already in queue')
    }
  }
}

async function connectWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  delay = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt === maxRetries) throw err
      const error = err as Error
      console.log(
        `Connection attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`
      )
      await new Promise((resolve) => setTimeout(resolve, delay))
      delay *= 2 // Exponential backoff
    }
  }
  throw new Error('Failed to connect after maximum retries')
}

try {
  await connectWithRetry(() => discord.login())
  console.log('Discord bot started')

  // Schedule the Google search job after Discord is connected
  await scheduleGoogleSearchJob()
} catch (error) {
  console.error('Failed to start Discord bot:', error)
  process.exit(1)
}
