import axios from 'axios'
import crypto from 'node:crypto'
import mailchimpConfig from '../../config/mailchimp'

const baseURL = `https://${mailchimpConfig.serverPrefix}.api.mailchimp.com/3.0`

export async function subscribeAndTagUser(
  email: string,
  reason: string,
  tag: string,
) {
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
