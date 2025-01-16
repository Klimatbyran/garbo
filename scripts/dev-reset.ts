import { parseArgs } from 'node:util'
import { promisify } from 'node:util'
import { exec as execSync } from 'node:child_process'
import readline from 'node:readline'

import { isMainModule } from './utils'
import { resetDB } from '../src/lib/dev-utils'
import { vectorDB } from '../src/lib/vectordb'

const exec = promisify(execSync)

// Reset development databases
//
// Usage example:
// npm run reset -- --chroma

async function resetIfConfirmed(
  service: 'chroma' | 'postgres' | 'redis' | 'all',
  callback: () => Promise<void>
) {
  const shouldRun = await confirm(
    `\n⚠️  Warning! Are you sure you want to reset "${service}"? (y/N) `
  )
  if (shouldRun) {
    console.log(`Resetting ${service}...`)
    await callback()
  }
}

function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) =>
    rl.question(message, (answer) => {
      if (answer === 'y') {
        resolve(true)
      }
      rl.close()
      resolve(false)
    })
  )
}

async function resetRedis() {
  const commands = [
    'docker exec garbo_redis redis-cli flushall',
    'podman exec garbo_redis redis-cli flushall',
  ]
  for (const cmd of commands) {
    try {
      const { stdout } = await exec(cmd)
      console.log(stdout)
      return
    } catch (err) {
      // Ignore the error and try the next command
    }
  }
  console.error(
    'Failed to reset Redis. Ensure either Docker or Podman is installed and running.'
  )
}

async function resetAll() {
  await Promise.all([vectorDB.clearAllReports(), resetDB(), resetRedis()])
}

async function main() {
  const { values } = parseArgs({
    options: {
      chroma: {
        type: 'boolean',
        default: false,
      },
      postgres: {
        type: 'boolean',
        default: false,
      },
      redis: {
        type: 'boolean',
        default: false,
      },
      all: {
        type: 'boolean',
        default: false,
      },
    },
  })

  if (values.chroma) {
    await resetIfConfirmed('chroma', () => vectorDB.clearAllReports())
  }

  if (values.postgres) {
    await resetIfConfirmed('postgres', () => resetDB())
  }

  if (values.redis) {
    await resetIfConfirmed('redis', async () => resetRedis())
  }

  if (values.all) return resetIfConfirmed('all', resetAll)
}

if (isMainModule(import.meta.url)) {
  await main()
}
