export default {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_APPLICATION_ID,
  guildId: process.env.DISCORD_SERVER_ID,
  worker: process.argv[1].includes('startWorker'), // since the discord is a singleton, we need to know if we are in a worker or not
  channelId: process.env.DISCORD_CHANNEL_ID || '1201463851447758879', // set to chanel rapporter-att-granska
}
