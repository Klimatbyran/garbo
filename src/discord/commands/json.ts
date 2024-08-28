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
    const message = await interaction.reply('Hämtar json för denna tråd')
    const jobs = await discordReview.getCompleted()
    const job = jobs.find(
      ({ data: { threadId } }) => interaction.channelId === threadId
    )
    if (!job)
      return await message.edit(
        'Hittade ingen json i denna tråd. Kan det vara så att den inte är klar? 🤔'
      )
    const {
      data: { json: returnvalue },
    } = job

    let json
    try {
      json = JSON.parse(returnvalue)
      if (!json || returnvalue === '{}') {
        await message.edit('Hittade inte json för denna tråd- är den klar?')
        return
      }
    } catch (error) {
      await message.edit('Kunde inte tolka json för denna tråd. Fel format?')
      return
    }

    const jsonFile = new AttachmentBuilder(Buffer.from(returnvalue), {
      name: json.companyName + '.json',
    })

    try {
      await message.edit({
        content: 'Här är resultatet',
        files: [jsonFile],
      })
    } catch (error) {
      console.log(error)
    }
  },
}
