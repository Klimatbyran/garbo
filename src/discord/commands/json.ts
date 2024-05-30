import { CommandInteraction, SlashCommandBuilder } from 'discord.js'
import { discordReview } from '../../queues'

export default {
  data: new SlashCommandBuilder()
    .setName('json')
    .setDescription('Replies with json for the current thread'),

  async execute(interaction: CommandInteraction) {
    const jobs = await discordReview.getCompleted()
    const job = jobs.find(
      ({ data: { threadId } }) => interaction.channelId === threadId
    )
    const {
      data: { url, json: returnvalue },
    } = job
    const json = JSON.parse(returnvalue)
    if (!json) {
      await interaction.reply('Hittade inte json för denna tråd- är den klar?')
      return
    }
    await interaction.reply(JSON.stringify(json, null, 2))
  },
}
