import { SlashCommandBuilder } from 'discord.js';
import { decisionQueue } from '../queues/decisionQueues';

export const startFlowCommand = {
    data: new SlashCommandBuilder()
        .setName('startconditionalflow')
        .setDescription('Starts the conditional flow.'),
    async execute(interaction: any) {
        await interaction.reply('Initializing conditional flow...');
        const messageId = (await interaction.fetchReply()).id;
        const channelId = interaction.channelId;
        await decisionQueue.add('makeDecision', { channelId, messageId });
    },
};
