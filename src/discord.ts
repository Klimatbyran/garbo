import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  TextChannel,
  ModalBuilder,
  ButtonBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ModalActionRowComponentBuilder,
  TextInputStyle,
  Embed,
  EmbedBuilder,
  Message,
} from 'discord.js'
import commands from './discord/commands'
import config from './config/discord'
import elastic from './elastic'
import { discordReview } from './queues'
import retry from './discord/interactions/retry'
import approve from './discord/interactions/approve'
import feedback from './discord/interactions/feedback'
import reject from './discord/interactions/reject'

export class Discord {
  client: Client<boolean>
  rest: REST
  commands: Array<any>
  token: string
  channelId: string

  constructor({ token, guildId, clientId, channelId }) {
    this.token = token
    this.channelId = channelId
    this.client = new Client({ intents: [GatewayIntentBits.Guilds] })
    this.rest = new REST().setToken(token)
    this.commands = commands.map((command) => command.data.toJSON())
    this.client.on('ready', () => {
      console.log('discord connected')
      const url = Routes.applicationGuildCommands(clientId, guildId)
      this.rest.put(url, { body: this.commands })
    })
    this.client.on('interactionCreate', async (interaction) => {
      if (interaction.isCommand()) {
        const command = commands.find(
          (command) => command.data.name === interaction.commandName
        )
        try {
          await command.execute(interaction)
        } catch (error) {
          console.error('Discord error:', error)
          await interaction.reply({
            content: 'There was an error while executing this command!',
            ephemeral: true,
          })
        }
      } else if (interaction.isButton()) {
        const [action, jobId] = interaction.customId.split('~')
        switch (action) {
          case 'approve': {
            const job = await discordReview.getJob(jobId)
            await approve.execute(interaction, job)
            break
          }
          case 'feedback': {
            const job = await discordReview.getJob(jobId)
            await feedback.execute(interaction, job)
            break
          }
          case 'reject': {
            const job = await discordReview.getJob(jobId)
            await reject.execute(interaction, job)
            break
          }
          case 'retry': {
            const job = await discordReview.getJob(jobId)
            retry.execute(interaction, job)
            break
          }
        }
      }
    })
  }

  login(token = this.token) {
    this.client.login(token)
    return this
  }

  public createButtonRow = (jobId: string) => {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`approve~${jobId}`)
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`feedback~${jobId}`)
        .setLabel('Feedback')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`reject~${jobId}`)
        .setLabel('Reject')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`retry~${jobId}`)
        .setLabel('🔁')
        .setStyle(ButtonStyle.Secondary)
    )
  }

  async editMessage(
    { channelId, messageId }: { channelId: string; messageId: string },
    msg: string
  ) {
    const channel = (await this.client.channels.fetch(channelId)) as TextChannel
    const message = await channel.messages.fetch(messageId)
    await message.edit(msg)
  }

  async createThread(
    { channelId, messageId }: { channelId: string; messageId: string },
    name: string
  ) {
    const channel = (await this.client.channels.fetch(channelId)) as TextChannel
    const message = await channel.messages.fetch(messageId)
    return message.startThread({
      name: name,
      autoArchiveDuration: 60,
    })
  }

  async sendMessageToChannel(channelId, message): Promise<Message> {
    try {
      const channel = await this.client.channels.fetch(channelId)
      if (!channel || !(channel instanceof TextChannel)) {
        console.error(`Kanalen hittades inte eller är inte en textkanal.`)
        return
      }
      return await channel.send(message)
    } catch (error) {
      console.error('Ett fel uppstod när meddelandet skulle skickas:', error)
    }
  }
}

export default new Discord(config)
