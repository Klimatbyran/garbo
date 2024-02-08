import { Worker, Job } from 'bullmq';
import { enqueueNextJob } from '../flows/conditionalFlow';
import redisConfig from '../config/redis';
import { TextChannel } from 'discord.js';
import discord from '../discord'

new Worker('decisionQueue', async (job: Job) => {
  const randomNumber = Math.floor(Math.random() * 10);
  console.log(`Generated number: ${randomNumber}`);

  const nextStep = randomNumber % 2 === 0 ? 'evenJob' : 'oddJob';
  await enqueueNextJob(nextStep, { message: `Processing ${nextStep}` });
}, { connection: redisConfig });

new Worker('evenJobQueue', async (job) => {
  const { channelId, messageId } = job.data;
  const channel = await discord.client.channels.fetch(channelId) as TextChannel;
  const message = await channel.messages.fetch(messageId);
  await message.edit(`Even job completed.`);
}, { connection: redisConfig });

new Worker('oddJobWorker', async (job) => {
    const { channelId, messageId } = job.data;
    const channel = await discord.client.channels.fetch(channelId) as TextChannel;
    const message = await channel.messages.fetch(messageId);
    await message.edit(`Odd job completed.`);
}, { connection: redisConfig });
