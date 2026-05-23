import 'dotenv/config'
import { parseArgs } from 'node:util'
import { createClient } from 'redis'
import redisConfig from '../src/config/redis'

type KeyMode = 'all' | 'ctx' | 'emb' | 'report-version'

const {
  values: { mode, dryRun, limit },
} = parseArgs({
  options: {
    mode: {
      type: 'string',
      default: 'ctx',
    },
    'dry-run': {
      type: 'boolean',
      default: false,
    },
    limit: {
      type: 'string',
      default: '2000',
    },
  },
})

const selectedMode = (mode as KeyMode) || 'ctx'
const maxDeletes = Math.max(1, Number(limit))

function buildPrefixMatch(selected: KeyMode): string {
  if (selected === 'all') return 'redis_vdb/*'
  if (selected === 'ctx') return 'redis_vdb/ctx:*'
  if (selected === 'emb') return 'redis_vdb/emb:*'
  return 'redis_vdb/report-version:*'
}

async function main() {
  const password = redisConfig.password ?? ''
  const auth = password ? `default:${password}@` : ''
  const url = `redis://${auth}${redisConfig.host}:${redisConfig.port}`

  const client = createClient({ url })
  await client.connect()

  const match = buildPrefixMatch(selectedMode)
  const keys: string[] = []

  for await (const key of client.scanIterator({ MATCH: match, COUNT: 1000 })) {
    keys.push(String(key))
    if (keys.length >= maxDeletes) {
      break
    }
  }

  if (dryRun) {
    console.log(
      `[dry-run] matched ${keys.length} keys for mode=${selectedMode}`
    )
  } else if (keys.length > 0) {
    await client.del(keys)
    console.log(`Deleted ${keys.length} keys for mode=${selectedMode}`)
  } else {
    console.log(`No keys found for mode=${selectedMode}`)
  }

  await client.quit()
}

main().catch((error) => {
  console.error('cleanup-vector-cache failed:', error)
  process.exitCode = 1
})
