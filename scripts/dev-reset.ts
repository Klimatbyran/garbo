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
  service: 'chroma' | 'postgres' | 'redis',
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
    },
  })

  if (values.chroma) {
    await resetIfConfirmed('chroma', () => vectorDB.clearAllReports())
  }

  if (values.postgres) {
    await resetIfConfirmed('postgres', () => resetDB())
  }

  if (values.redis) {
    await resetIfConfirmed('redis', async () => {
      const { stderr, stdout } = await exec(
        'podman exec -it garbo_redis bash -c "redis-cli flushall"'
      )
      if (stderr) console.error(stderr)
      console.log(stdout)
    })
  }
}

if (isMainModule(import.meta.url)) {
  await main()
}
