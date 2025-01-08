import { config } from 'dotenv'

config()

export default {
  github: {
    clientID: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback',
    organization: process.env.GITHUB_ORG_NAME || 'your-org-name',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '24h',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'session-secret',
  }
}
