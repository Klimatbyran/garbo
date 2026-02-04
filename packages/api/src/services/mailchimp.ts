import axios from 'axios'
import crypto from 'node:crypto'
import mailchimpConfig from '../../config/mailchimp'
import { z } from 'zod'

const baseURL = `https://${mailchimpConfig.serverPrefix}.api.mailchimp.com/3.0`

const ALLOWED_TEMPLATE_IDS = [581, 116]

const campaignSchema = z.object({
  settings: z
    .object({
      preview_text: z.string().optional().nullable(),
      subject_line: z.string().optional().nullable(),
      template_id: z.coerce.number().optional(),
    })
    .optional(),
  id: z.string(),
  send_time: z.string(),
  long_archive_url: z.string(),
})

export const mailchimpResponseSchema = z.object({
  campaigns: z.array(campaignSchema),
})

export async function fetchNewsletters() {
  if (!mailchimpConfig.apiKey) {
    throw new Error('Mailchimp API key is required')
  }

  try {
    const response = await axios.get(
      `${baseURL}/campaigns?offset=0&count=9999`,
      {
        auth: {
          username: 'anystring',
          password: mailchimpConfig.apiKey,
        },
      }
    )

    const parsedResponse = mailchimpResponseSchema.parse(response.data)

    // Filter campaigns to only include those with allowed template IDs
    const filteredCampaigns = {
      ...parsedResponse,
      campaigns: parsedResponse.campaigns.filter(
        (campaign) =>
          campaign.settings?.template_id !== undefined &&
          ALLOWED_TEMPLATE_IDS.includes(campaign.settings.template_id)
      ),
    }

    return filteredCampaigns
  } catch (err) {
    console.error('Failed to fetch newsletters:', err)
    throw new Error('Failed to fetch newsletters from Mailchimp')
  }
}

export async function subscribeAndTagUser(
  email: string,
  reason: string,
  tag: string
) {
  if (!mailchimpConfig.apiKey) {
    throw new Error('Mailchimp API key is required')
  }

  const subscriberHash = createSubscriberHash(email)

  // 1. Try to upsert subscriber
  try {
    await axios.put(
      `${baseURL}/lists/${mailchimpConfig.listId}/members/${subscriberHash}`,
      {
        email_address: email,
        status_if_new: 'subscribed',
        merge_fields: {
          MMERGE6: reason,
        },
      },
      {
        auth: {
          username: 'anystring',
          password: mailchimpConfig.apiKey,
        },
      }
    )
  } catch (error: any) {
    const mailchimpError = error?.response?.data
    if (
      mailchimpError?.title === 'Member Exists' ||
      mailchimpError?.status === 400
    ) {
      console.log('User already subscribed, proceeding to tag...')
    } else {
      throw new Error('Failed to upsert subscriber')
    }
  }

  // 2. Apply the tag
  try {
    await axios.post(
      `${baseURL}/lists/${mailchimpConfig.listId}/members/${subscriberHash}/tags`,
      {
        tags: [
          {
            name: tag,
            status: 'active',
          },
        ],
      },
      {
        auth: {
          username: 'anystring',
          password: mailchimpConfig.apiKey,
        },
      }
    )
  } catch (error) {
    throw new Error('Failed to apply tag to subscriber')
  }
}

// Helper function
function createSubscriberHash(email: string): string {
  return crypto.createHash('md5').update(email.toLowerCase()).digest('hex')
}
