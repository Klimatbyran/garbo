import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  DISCORD_TOKEN: z.string(),
  DISCORD_APPLICATION_ID: z.string(),
  DISCORD_SERVER_ID: z.string(),
  DISCORD_CHANNEL_ID: z.string(), // defaults to the channel `garbo` on the klimatkollen Discord server
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid initialization of Discord environment variables:')
  console.error(parsedEnv.error.format())

  if (
    parsedEnv.error.errors.some(
      (err) => err.path[0] === 'DISCORD_APPLICATION_ID',
    )
  ) {
    console.error(
      'DISCORD_APPLICATION_ID must be an ID in the form of a string.',
    )
    console.error(
      'When running locally, check the .env.example file for how to gather this variable.',
    )
    console.error(
      'In production, ensure this is correctly set in your Kubernetes config.',
    )
  }

  if (parsedEnv.error.errors.some((err) => err.path[0] === 'DISCORD_TOKEN')) {
    console.error('DISCORD_TOKEN must be a key in the form of a string.')
    console.error(
      'When running locally, check the .env.example file for how to gather this variable.',
    )
    console.error(
      'In production, ensure this is correctly set in your Kubernetes config.',
    )
  }

  if (
    parsedEnv.error.errors.some((err) => err.path[0] === 'DISCORD_SERVER_ID')
  ) {
    console.error('DISCORD_SERVER_ID must be an ID in the form of a string.')
    console.error(
      'When running locally, check the .env.example file for how to gather this variable.',
    )
    console.error(
      'In production, ensure this is correctly set in your Kubernetes config.',
    )
  }

  if (
    parsedEnv.error.errors.some((err) => err.path[0] === 'DISCORD_CHANNEL_ID')
  ) {
    console.error('DISCORD_CHANNEL_ID must be an ID in the form of a string.')
    console.error(
      'When running locally, check the .env.example file for how to gather this variable.',
    )
    console.error(
      'In production, ensure this is correctly set in your Kubernetes config.',
    )
  }

  throw new Error('Invalid initialization of Discord environment variables')
}

const env = parsedEnv.data

const FIVE_MIN = 1000 * 60 * 5

export default {
  token: env.DISCORD_TOKEN,
  clientId: env.DISCORD_APPLICATION_ID,
  guildId: env.DISCORD_SERVER_ID,
  /**
   * Since our Discord wrapper is a singleton, we need to know if we are in a worker or not
   */
  worker: process.argv[1].includes('startWorker'),
  channelId: env.DISCORD_CHANNEL_ID,
  modalInteractionTimeout: FIVE_MIN,
}
