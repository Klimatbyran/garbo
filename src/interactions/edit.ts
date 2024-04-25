import { pdf2Markdown } from '../queues'

export default {
  async execute(interaction, job) {
    const { url, channelId, messageId, json } = job.data
    const parsedJson = JSON.parse(json)

    job.log(`Received feedback: ${feedback} for messageId: ${message?.id}`)
    job.log(`Creating feedback job`)
    await userFeedback.add('userFeedback', {
      url,
      documentId,
      messageId: message.id,
      channelId,
      json: JSON.stringify(parsedJson, null, 2),
      feedback,
    })
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
