import { z } from 'zod'

const envSchema = z.object({
  DISCORD_TOKEN: z.string(),
  DISCORD_APPLICATION_ID: z.string(),
  DISCORD_SERVER_ID: z.string(),
  DISCORD_CHANNEL_ID: z.string().default('1201463851447758879'), // defaults to the channel `rapporter-att-granska` on the klimatkollen Discord server
})

const env = envSchema.parse(process.env)

export default {
  token: env.DISCORD_TOKEN,
  clientId: env.DISCORD_APPLICATION_ID,
  guildId: env.DISCORD_SERVER_ID,
  /**
   * Since our Discord wrapper is a singleton, we need to know if we are in a worker or not
   */
  worker: process.argv[1].includes('startWorker'),
  channelId: env.DISCORD_CHANNEL_ID,
}
