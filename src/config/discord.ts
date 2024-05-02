export default {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_APPLICATION_ID,
  guildId: process.env.DISCORD_SERVER_ID,
  worker: process.env.DISCORD_WORKER === 'true',
  channelId: '1201463851447758879', // set to chanel rapporter-att-granska
}
