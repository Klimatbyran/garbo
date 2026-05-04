import 'dotenv/config'
import { createClient } from 'redis'
import redisConfig from '../src/config/redis'

async function countKeysByMatch(
  client: ReturnType<typeof createClient>,
  match: string
): Promise<number> {
  let count = 0
  for await (const _ of client.scanIterator({ MATCH: match, COUNT: 1000 })) {
    count++
  }
  return count
}

async function main() {
  const password = redisConfig.password ?? ''
  const auth = password ? `default:${password}@` : ''
  const url = `redis://${auth}${redisConfig.host}:${redisConfig.port}`

  const client = createClient({ url })
  await client.connect()

  const [memoryInfo, retrievalKeys, embeddingKeys, versionKeys, bullKeys] =
    await Promise.all([
      client.info('memory'),
      countKeysByMatch(client, 'redis_vdb/ctx:*'),
      countKeysByMatch(client, 'redis_vdb/emb:*'),
      countKeysByMatch(client, 'redis_vdb/report-version:*'),
      countKeysByMatch(client, 'bull:*'),
    ])

  const usedMemoryLine = memoryInfo
    .split('\n')
    .find((line) => line.startsWith('used_memory_human:'))
    ?.trim()

  console.log('Redis Cache Health Report')
  console.log(`- ${usedMemoryLine || 'used_memory_human:unknown'}`)
  console.log(`- vector retrieval keys: ${retrievalKeys}`)
  console.log(`- vector embedding keys: ${embeddingKeys}`)
  console.log(`- vector report-version keys: ${versionKeys}`)
  console.log(`- bull keys: ${bullKeys}`)

  await client.quit()
}

main().catch((error) => {
  console.error('report-cache-health failed:', error)
  process.exitCode = 1
})
