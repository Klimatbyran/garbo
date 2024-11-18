import { ENV } from '../lib/env'

export default {
  path: ENV.CHROMA_HOST,
  auth: ENV.CHROMA_TOKEN
    ? {
        provider: 'token',
        credentials: ENV.CHROMA_TOKEN,
      }
    : undefined,
}
