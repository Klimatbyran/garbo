import pdf2Markdown from '../../workers/pdf2Markdown'

export default {
  async execute(interaction, job) {
    const { url, threadId, json } = job.data
    await interaction.deferReply({ ephemeral: true })
    const parsedJson = JSON.parse(json)
    await pdf2Markdown.queue.add('pdf2Markdown', {
      url,
      threadId,
    })
    interaction.message.reply(
      `Parsing ${parsedJson.companyName} PDF report as markdown and trying again...`
    )
  },
}
