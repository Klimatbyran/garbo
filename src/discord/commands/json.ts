import {
  AttachmentBuilder,
  CommandInteraction,
  SlashCommandBuilder,
} from 'discord.js'
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

    let json
    try {
      json = JSON.parse(returnvalue)
      if (!json || returnvalue === '{}') {
        await interaction.reply(
          'Hittade inte json för denna tråd- är den klar?'
        )
        return
      }
    } catch (error) {
      await interaction.reply('Kunde inte tolka json för denna tråd')
      return
    }

    const jsonFile = new AttachmentBuilder(Buffer.from(returnvalue), {
      name: json.companyName + '.json',
    })

    try {
      await interaction.reply({
        content: 'Här är resultatet',
        files: [jsonFile],
      })
    } catch (error) {
      await interaction.reply({
        content: `Fel: ${error.message}`,
      })
      console.log(error)
    }
  },
}
