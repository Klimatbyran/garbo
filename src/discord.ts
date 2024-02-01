import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  TextChannel,
} from 'discord.js'
import commands from './commands'
import config from './config/discord'

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
      if (!interaction.isCommand()) return
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
    })
  }
  login(token = this.token) {
    this.client.login(token)
    return this
  }

  async sendMessageToChannel(channelId, message) {
    try {
      const channel = await this.client.channels.fetch(channelId)
      if (!channel || !(channel instanceof TextChannel)) {
        console.error(`Kanalen hittades inte eller är inte en textkanal.`)
        return
      }
      await channel.send(message)
    } catch (error) {
      console.error('Ett fel uppstod när meddelandet skulle skickas:', error)
    }
  }
}

export default new Discord(config)
