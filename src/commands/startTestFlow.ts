import { SlashCommandBuilder } from 'discord.js';
import {  } from '../queues';
import testFlow from '../flows/testFlow';

export default {
    data: new SlashCommandBuilder()
      .setName('testflow')
      .setDescription('Start the test flow'),
  
    async execute(interaction) {
      console.log('testflow start')
      await interaction.reply('Initializing test flow...');
      const messageId = (await interaction.fetchReply()).id;
      const channelId = interaction.channelId;
  
      await testFlow(channelId, messageId);
      console.log('testflow done')
    },
  }