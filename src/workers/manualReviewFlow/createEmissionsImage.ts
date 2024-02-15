import { Job, Worker } from 'bullmq';
import redisConfig from '../../config/redis';
import { TextChannel } from 'discord.js';
import discord from '../../discord'

class JobData extends Job {
  data: {
    channelId: string
    messageId: string
  }
}

const worker = new Worker('createEmissionsImage', async (job: JobData) => {
  console.log('Executing createEmissionsImage:', job.data);
  const { channelId, messageId } = job.data;
  const channel = await discord.client.channels.fetch(channelId) as TextChannel;
  const message = await channel.messages.fetch(messageId);
  await message.edit(`createEmissionsImage completed.`);
}, { connection: redisConfig });

export default worker;