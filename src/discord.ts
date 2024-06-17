import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  TextChannel,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  Message,
  ThreadChannel,
  ChatInputCommandInteraction,
} from 'discord.js'
import commands from './discord/commands'
import config from './config/discord'
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

  constructor({ worker, token, guildId, clientId, channelId }) {
    this.token = token
    this.channelId = channelId
    this.client = new Client({ intents: [GatewayIntentBits.Guilds] })
    this.rest = new REST().setToken(token)
    if (!worker) {
      this.commands = commands.map((command) => command.data.toJSON())
      this.client.on('ready', () => {
        console.log('discord switch connected')
        const url = Routes.applicationGuildCommands(clientId, guildId)
        this.rest.put(url, { body: this.commands })
      })

      // mentioned user
      // this.client.on('messageCreate', async (message) => {
      //   if (message.author.bot) return
      //   const mentioned = message.mentions.users.filter((user) => user.id !== this.client.user.id).first()
      //   if (mentioned) {
      //     console.log('mentioned user:', mentioned.username)
      //     // TODO: add message to feedback queue
      // })

      this.client.on('interactionCreate', async (interaction) => {
        if (interaction.isCommand()) {
          const command = commands.find(
            (command) => command.data.name === interaction.commandName
          )
          try {
            await command.execute(interaction as ChatInputCommandInteraction)
          } catch (error) {
            console.error('Discord error:', error)
            // await interaction.reply({
            //   content: 'There was an error while executing this command!',
            //   ephemeral: true,
            // })
            return
          }
        } else if (interaction.isButton()) {
          const [action, jobId] = interaction.customId.split('~')
          try {
            switch (action) {
              case 'approve': {
                const job = await discordReview.getJob(jobId)
                if (!job) await interaction.reply('Job not found')
                else await approve.execute(interaction, job)
                break
              }
              case 'feedback': {
                const job = await discordReview.getJob(jobId)
                if (!job) await interaction.reply('Job not found')
                else await feedback.execute(interaction, job)
                break
              }
              case 'reject': {
                const job = await discordReview.getJob(jobId)
                if (!job) await interaction.reply('Job not found')
                else await reject.execute(interaction, job)
                break
              }
              case 'retry': {
                const job = await discordReview.getJob(jobId)
                if (!job) await interaction.reply('Job not found')
                else retry.execute(interaction, job)
                break
              }
            }
          } catch (error) {
            console.error('Discord error:', error)
          }
        }
      })
    } else {
      this.client.on('ready', () => {
        console.log('discord worker connected')
      })
    }
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

  public createFeedbackButtonRow = (jobId: string) => {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`approve-feedback~${jobId}`)
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`reject-feedback~${jobId}`)
        .setLabel('Reject')
        .setStyle(ButtonStyle.Danger)
    )
  }

  async sendMessage({ threadId }: { threadId: string }, msg: string) {
    try {
      const thread = (await this.client.channels.fetch(
        threadId
      )) as ThreadChannel
      await thread?.sendTyping()
      return thread.send(msg)
    } catch (e) {
      console.error('Error sending message to thread', e)
      return undefined
    }
  }

  async sendTyping({ threadId }: { threadId: string }) {
    const thread = (await this.client.channels.fetch(threadId)) as ThreadChannel
    return thread.sendTyping()
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
    const channel = (await this.client.channels.fetch(channelId)) as TextChannel
    return await channel.send(message)
  }

  async lockThread(channelId) {
    const channel = await this.client.channels.fetch(channelId)
    if (channel.isThread()) {
      await channel.setLocked(true)
      //await channel.setArchived(true);
    } else {
      console.error('The specified channel is not a thread.')
    }
  }
}

export default new Discord(config)
