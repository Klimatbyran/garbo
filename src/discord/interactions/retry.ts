import { pdf2Markdown } from '../../queues'

export default {
  async execute(interaction, job) {
    const { url, channelId, messageId, json } = job.data
    const parsedJson = JSON.parse(json)
    await pdf2Markdown.add('pdf2Markdown', {
      url,
      channelId,
      messageId: messageId,
    })
    interaction.message.reply(
      `Parsing ${parsedJson.companyName} PDF report as markdown and trying again...`
    )
  },
}
