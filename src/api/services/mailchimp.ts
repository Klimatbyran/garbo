import axios from 'axios'
import crypto from 'node:crypto'

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY!
const MAILCHIMP_SERVER_PREFIX = 'us14' // Change if needed
const MAILCHIMP_LIST_ID = '133270842a'
const TAG_NAME = 'free-database-download-request'

const baseURL = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0`

export async function subscribeAndTagUser(email: string, reason: string) {
  const subscriberHash = createSubscriberHash(email)

  // 1. Try to upsert subscriber
  try {
    await axios.put(
      `${baseURL}/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`,
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
          password: MAILCHIMP_API_KEY,
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
      `${baseURL}/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}/tags`,
      {
        tags: [
          {
            name: TAG_NAME,
            status: 'active',
          },
        ],
      },
      {
        auth: {
          username: 'anystring',
          password: MAILCHIMP_API_KEY,
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