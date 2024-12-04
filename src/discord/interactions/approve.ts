import { ButtonInteraction } from 'discord.js'
import { DiscordJob } from '../../lib/DiscordWorker'
import { Queue } from 'bullmq'

const saveToApiQueue = new Queue('api-save', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
})

export default {
  async execute(interaction: ButtonInteraction, job: DiscordJob) {
    await job.updateData({ ...job.data, approved: true })
    
    // Add to API save queue
    await apiSaveQueue.add('save-approved', {
      ...job.data,
      approved: true
    })
    
    job.log(`Approving company edit: ${job.data.wikidataId}`)
    await interaction.reply({
      content: `Tack för din granskning, ${interaction?.user?.username}!`,
    })
    
    await job.promote()
  },
}
