import { ENV } from '../lib/env'

export default {
  token: ENV.DISCORD_TOKEN,
  clientId: ENV.DISCORD_APPLICATION_ID,
  guildId: ENV.DISCORD_SERVER_ID,
  worker: process.argv[1].includes('startWorker'), // since the discord is a singleton, we need to know if we are in a worker or not
  channelId: ENV.DISCORD_CHANNEL_ID || '1201463851447758879', // set to chanel rapporter-att-granska
}
