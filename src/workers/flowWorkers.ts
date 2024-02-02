import { Worker } from 'bullmq';
import redisConfig from '../config/redis';
import { TextChannel } from 'discord.js';
import discord from '../discord'

// Create a generic test worker
function createWorker(queueName: string, stepMessage: string) {
  return new Worker(queueName, async (job) => {
    const { channelId, messageId } = job.data;
    const channel = await discord.client.channels.fetch(channelId) as TextChannel;
    const message = await channel.messages.fetch(messageId);
    await message.edit(`${stepMessage} completed.`);
  }, { connection: redisConfig });
}

// Create each worker by calling the function with appropriate parameters
const step1Worker = createWorker('testStep1', 'Step 1 Processing');
const step2Worker = createWorker('testStep2', 'Step 2 Processing');
const step3Worker = createWorker('testStep3', 'Step 3 Processing');

export { step1Worker, step2Worker, step3Worker };
