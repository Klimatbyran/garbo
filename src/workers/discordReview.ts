import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import discord from '../config/discord'
import { REST, Routes } from 'discord.js'
const rest = new REST({ version: '10' }).setToken(discord.TOKEN)

class JobData extends Job {
  data: {
    url: string
    json: string
  }
}

const worker = new Worker(
  'discordReview',
  async (job: JobData) => {
    job.log(`Registring slash command with token ${discord.TOKEN}`)

    // Is this a problem to do every time?
    job.updateProgress(5)

    job.log(`Sending for review in Discord: ${job.data.json}`)
    job.updateProgress(10)
    const json = JSON.stringify(job.data.json)

    // TODO: add modal to review json manually:
    //    https://discordjs.guide/interactions/modals.html#building-and-responding-with-modals

    // send to Discord
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
