import 'dotenv/config'
import discord from './discord'
//

// keep this line, otherwise the workers won't be started
import * as workers from './workers'
// start workers
console.log('Starting workers...')
// autorun: true means we don't have to call run() manually
//Object.values(workers).forEach((worker) => worker.run())

console.log(
  Object.values(workers)
    .map((worker) => `✅ ${worker.name}`)
    .join('\n')
)

discord.login()
console.log('Discord bot started')
