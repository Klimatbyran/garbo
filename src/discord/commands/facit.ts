import { CommandInteraction, SlashCommandBuilder } from 'discord.js'
import { reflectOnAnswer } from '../../queues'
import { findFacit } from '../../lib/facit'
import { summaryTable } from '../../lib/discordTable'

export default {
  data: new SlashCommandBuilder()
    .setName('facit')
    .setDescription('Replies with facit in a thread'),

  async execute(interaction: CommandInteraction) {
    const jobs = await reflectOnAnswer.getCompleted()
    const job = jobs.find(
      ({ data: { threadId } }) => interaction.channelId === threadId
    )
    const {
      data: { url },
      returnvalue,
    } = job
    const json = JSON.parse(returnvalue)
    const facit = await findFacit(url)

    if (!facit) {
      await interaction.reply('Hittade inte facit.')
      return
    }
    const summary = await summaryTable(facit)
    const emojis = facit.emissions.map(({ scope1, scope2, year }) => {
      console.log(json.emissions)
      const jsonYear = json.emissions.find(({ year: y }) => y == year)
      const s1 =
        scope1.emissions == jsonYear.scope1.emissions
          ? '✅'
          : `❌ ${scope1.emissions} != ${jsonYear.scope1.emissions}`
      const s2 =
        scope2.emissions == jsonYear.scope2.emissions
          ? '✅'
          : `❌ ${scope2.emissions} != ${jsonYear.scope2.emissions}`
      return `\`${year}
scope1:${s1} 
scope2:${s2}\``
    })

    await interaction.reply(emojis.join('\n'))
  },
}
