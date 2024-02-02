import { SlashCommandBuilder } from 'discord.js';
import { startTestFlow } from '../queues/testFlowQueue';

export default {
    data: new SlashCommandBuilder()
      .setName('testflow')
      .setDescription('Start the test flow'),
  
    async execute(interaction) {
      console.log('testflow')
      await interaction.reply('Initializing test flow...');
      const messageId = (await interaction.fetchReply()).id;
      const channelId = interaction.channelId;
  
      await startTestFlow(channelId, messageId);
    },
  }