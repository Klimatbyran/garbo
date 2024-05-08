import { CommandInteraction, SlashCommandBuilder } from 'discord.js'
import { discordReview, reflectOnAnswer } from '../../queues'
import { findFacit } from '../../lib/facit'
import { summaryTable } from '../../lib/discordTable'
import { YearEmissions } from '../../models/companyEmissions'

export default {
  data: new SlashCommandBuilder()
    .setName('facit')
    .setDescription('Replies with facit in a thread'),

  async execute(interaction: CommandInteraction) {
    const jobs = await discordReview.getCompleted()
    const job = jobs.find(
      ({ data: { threadId } }) => interaction.channelId === threadId
    )
    const {
      data: { url, json: returnvalue },
    } = job
    const json = JSON.parse(returnvalue)
    const facit = await findFacit(url)

    if (!facit) {
      await interaction.reply('Hittade inte facit.')
      return
    }
    const summary = await summaryTable(facit)
    const emojis = facit.emissions.map(({ scope1, scope2, scope3, year }) => {
      console.log(json.emissions)
      const jsonYear = json.emissions.find(
        ({ year: y }) => y == year
      ) as YearEmissions
      const s1 =
        scope1.emissions == jsonYear.scope1.emissions
          ? '✅'
          : `❌ ${scope1.emissions} != ${jsonYear.scope1.emissions}`
      const s2 =
        scope2.emissions == jsonYear.scope2.emissions
          ? '✅'
          : `❌ ${scope2.emissions} != ${jsonYear.scope2.emissions}`

      const s3Total =
        scope3.emissions == jsonYear.scope3.emissions
          ? '✅'
          : `❌ ${scope3.emissions} != ${jsonYear.scope3.emissions}`

      const s3 = Object.entries(jsonYear.scope3.categories)
        .map(([category, value]) => {
          const facitValue = scope3.categories[category]
          if (!facitValue) return ''
          return facitValue == value
            ? `✅ ${category}`
            : `❌ ${category}: ${facitValue} != ${value}`
        })
        .filter(Boolean)
        .join('\n')

      if (s1 === '✅' && s2 === '✅' && s3Total === '✅')
        return `✅ ${year} ALL OK`

      return `\`${year}
scope1:${s1} 
scope2:${s2}
scope3:${s3Total}
${s3}
\``
    })

    await interaction.reply(emojis.join('\n'))
  },
}
