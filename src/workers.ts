import { Queue } from 'bullmq'
import fs from 'fs'
import redis from './config/redis'

const options = { connection: redis }

export const workers = fs
  .readdirSync('src/workers')
  .map((file) => file.replace('.ts', ''))
  .map((name) => ({
    name,
    queue: new Queue(name, options),
    run: async () => {
      await import(`./workers/${name}`)
      return name
    },
  }))

// Add manual registration of new workers that might not be in the directory yet
const additionalWorkers = [
  'verifyScope3',
  'verifyCalculations'
]

additionalWorkers.forEach(name => {
  if (!workers.find(w => w.name === name)) {
    workers.push({
      name,
      queue: new Queue(name, options),
      run: async () => {
        await import(`./workers/${name}`)
        return name
      }
    })
  }
})
