import 'dotenv/config'
import discord from './discord'
import { workers } from './workers'

// start workers
console.log('Starting workers...')
Promise.all(workers.map((worker) => worker.run()))
  .then((results) => results.join('\n'))
  .then(console.log)

discord.login()
console.log('Discord bot started')
