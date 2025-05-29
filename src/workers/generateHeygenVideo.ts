import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { QUEUE_NAMES } from '../queues'
import heygenConfig from '../config/heygen'

export class GenerateHeygenVideoJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    showNotes: {
      title: string
      script: string
    }
    videoId?: string
  }
}

interface HeygenVideoResponse {
  data: {
    video_id: string
  }
}

interface HeygenVideoStatusResponse {
  data: {
    status: 'pending' | 'processing' | 'completed' | 'failed'
    video_url?: string
    error?: string
  }
}

const generateHeygenVideo = new DiscordWorker<GenerateHeygenVideoJob>(
  QUEUE_NAMES.GENERATE_HEYGEN_VIDEO,
  async (job) => {
    const { companyName, showNotes, videoId } = job.data

    // If we already have a videoId, check its status
    if (videoId) {
      return await checkVideoStatus(job, videoId)
    }

    job.sendMessage(`🎥 Generating climate news video for ${companyName}...`)

    try {
      // Clean up the script by removing markdown formatting and pause notations
      const cleanScript = showNotes.script
        .replace(/\[\[pause \d+\.\d+s\]\]/g, '')
        .trim()

      job.log(`Generating video with script: ${cleanScript}`)

      // Generate the video using HeyGen API
      const response = await fetch(`${heygenConfig.baseUrl}/v2/video/generate`, {
        method: 'POST',
        headers: {
          'X-Api-Key': heygenConfig.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          video_inputs: [
            {
              character: {
                type: 'avatar',
                avatar_id: heygenConfig.avatarId,
                avatar_style: heygenConfig.avatarStyle
              },
              voice: {
                type: 'text',
                input_text: cleanScript,
                voice_id: heygenConfig.voiceId,
                speed: heygenConfig.voiceSpeed
              }
            }
          ],
          dimension: heygenConfig.dimension
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HeyGen API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json() as HeygenVideoResponse
      const newVideoId = result.data.video_id

      job.log(`Video generation started with ID: ${newVideoId}`)
      
      // Update job data with the video ID
      await job.updateData({
        ...job.data,
        videoId: newVideoId
      })

      // Check the status immediately
      return await checkVideoStatus(job, newVideoId)
    } catch (error) {
      job.log(`Error generating video: ${error.message}`)
      job.editMessage(`❌ Failed to generate video: ${error.message}`)
      throw error
    }
  }
)

async function checkVideoStatus(job: GenerateHeygenVideoJob, videoId: string): Promise<{ videoUrl?: string }> {
  try {
    job.log(`Checking status for video ID: ${videoId}`)
    job.editMessage(`🔄 Checking video generation status...`)

    const response = await fetch(`${heygenConfig.baseUrl}/v1/video_status.get?video_id=${videoId}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': heygenConfig.apiKey,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HeyGen API status check error: ${response.status} - ${errorText}`)
    }

    const result = await response.json() as HeygenVideoStatusResponse
    const status = result.data.status

    job.log(`Video status: ${status}`)

    if (status === 'completed' && result.data.video_url) {
      // Video is ready
      job.editMessage(`✅ Climate news video generated successfully!`)
      await job.sendMessage(`## 🎬 Climate News Video Ready!\n\n**${job.data.showNotes.title}**\n\n[Download Video](${result.data.video_url})`)
      
      return { videoUrl: result.data.video_url }
    } else if (status === 'failed') {
      // Video generation failed
      const errorMessage = result.data.error || 'Unknown error'
      job.editMessage(`❌ Video generation failed: ${errorMessage}`)
      throw new Error(`Video generation failed: ${errorMessage}`)
    } else {
      // Video is still processing, reschedule the job to check again
      job.log(`Video is still ${status}, will check again in 30 seconds`)
      job.editMessage(`🔄 Video is ${status}... (this may take a few minutes)`)
      
      // Delay the job for 30 seconds before checking again
      await job.moveToDelayed(Date.now() + 30000)
      return {}
    }
  } catch (error) {
    job.log(`Error checking video status: ${error.message}`)
    job.editMessage(`❌ Error checking video status: ${error.message}`)
    throw error
  }
}

export default generateHeygenVideo
