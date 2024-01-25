import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import discord from '../discord'
import {
  ModalBuilder,
  ButtonBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  ButtonStyle,
} from 'discord.js'

class JobData extends Job {
  data: {
    url: string
    json: string
  }
}

const worker = new Worker(
  'discordReview',
  async (job: JobData) => {
    // Is this a problem to do every time?
    job.updateProgress(5)

    job.log(`Sending for review in Discord: ${job.data.json}`)
    job.updateProgress(10)
    const json = JSON.parse(job.data.json)

    // Skapa en knapp
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('approve')
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('edit')
        .setLabel('Edit')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('reject')
        .setLabel('Reject')
        .setStyle(ButtonStyle.Danger)
    )

    discord.sendMessageToChannel(discord.channelId, {
      content: `En ny årsredovisning är redo för manuell hantering: 
        ${json.ReviewComment}
        ${job.data.url}`,
      embeds: [
        {
          title: 'Review this JSON:',
          description: '```json\n' + JSON.stringify(json, null, 2) + '\n```',
        },
      ],
      components: [row],
    })

    discord.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return

      // TODO: kolla att vi är på rätt ärende

      if (interaction.customId === 'approve') {
        interaction.update({
          content: 'Approved!',
          embeds: [],
          components: [],
        })
      } else if (interaction.customId === 'edit') {
        interaction.update({
          content: 'Edit!',
          embeds: [],
          components: [],
        })
      } else if (interaction.customId === 'reject') {
        interaction.update({
          content: 'Rejected!',
          embeds: [],
          components: [],
        })
      }
    })

    // TODO: add modal to review json manually:
    //    https://discordjs.guide/interactions/modals.html#building-and-responding-with-modals

    // send to Discord
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
