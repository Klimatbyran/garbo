import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import elastic from '../elastic'
import discord from '../discord'
import {
  ModalBuilder,
  ButtonBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ModalActionRowComponentBuilder,
  TextInputStyle,
  Embed,
  EmbedBuilder,
} from 'discord.js'
import { summaryTable, scope3Table } from '../lib/discordTable'

class JobData extends Job {
  data: {
    url: string
    json: string
    channelId: string
    messageId: string
    pdfHash: string
  }
}

async function saveToDb(id: string, report: any) {
  return await elastic.indexReport(id, report)
}

const buttonRow = new ActionRowBuilder().addComponents(
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

const worker = new Worker(
  'discordReview',
  async (job: JobData) => {
    // Is this a problem to do every time?
    job.updateProgress(5)

    job.log(`Sending for review in Discord: ${job.data.json}`)

    job.updateProgress(10)
    const parsedJson = JSON.parse(job.data.json)
    parsedJson.url = job.data.url
    job.log(`Saving to db: ${job.data.pdfHash}`)
    const documentId = await saveToDb(job.data.pdfHash, parsedJson)

    const summary = await summaryTable(parsedJson)
    const scope3 = await scope3Table(parsedJson)

    job.log(`Sending message to Discord channel ${discord.channelId}`)
    try {
      discord.sendMessageToChannel(discord.channelId, {
        content: `# ${parsedJson.companyName} (*${parsedJson.industry}*)
${job.data.url}
\`${summary}\`
## Scope 3:
\`${scope3}\`
        ${
          parsedJson.reviewComment
            ? `Kommentar från Garbo: ${parsedJson.reviewComment.slice(0, 100)}`
            : ''
        }
        `,
        components: [buttonRow],
      })
    } catch (error) {
      job.log(`Error sending message to Discord channel: ${error.message}`)
      throw error
    }

    job.updateProgress(40)

    discord.client.on('interactionCreate', async (interaction) => {
      let reportState = ''
      if (interaction.isButton() && interaction.customId === 'approve') {
        reportState = 'approved'
        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle('Godkänd')
              .setDescription(
                `Tack för din granskning, ${interaction?.user?.username}!`
              ),
          ],
          components: [],
        })
      } else if (interaction.isButton() && interaction.customId === 'edit') {
        reportState = 'edited'
        const input = new TextInputBuilder()
          .setCustomId('editInput')
          .setLabel(`Granska utsläppsdata`)
          .setStyle(TextInputStyle.Paragraph)

        const actionRow =
          new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            input
          )

        const modal = new ModalBuilder()
          .setCustomId('editModal')
          .setTitle(`Granska data för ${parsedJson.companyName}`)
          .addComponents(actionRow)
        // todo diskutera hur detta görs på bästa sätt för mänskliga granskaren. vad är alex input?

        await interaction.showModal(modal)

        const submitted = await interaction
          .awaitModalSubmit({
            time: 60000 * 20, // user has to submit the modal within 20 minutes
            filter: (i) => i.user.id === interaction.user.id, // only user who clicked button can interact with modal
          })
          .catch((error) => {
            console.error(error)
            return null
          })

        if (submitted) {
          const userInput = submitted.fields.getTextInputValue('editInput')
          await submitted.reply({
            content: `Tack för din granskning: \n ${userInput}`,
          })
        }
      } else if (interaction.isButton() && interaction.customId === 'reject') {
        // todo diskutera vad vill vill händer. ska man ens få rejecta?
        reportState = 'rejected'
        interaction.update({
          content: 'Rejected!',
          embeds: [],
          components: [],
        })
      }

      if (reportState !== '') {
        try {
          await elastic.updateDocumentState(documentId, reportState)
        } catch (error) {
          job.log(`Error updating document state: ${error.message}`)
        }
      }
    })
    job.updateProgress(100)
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
