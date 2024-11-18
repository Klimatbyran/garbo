import { ENV } from '../lib/env'

export default {
  // Used by the `OpenAIEmbeddingFunction` from `chromadb`:
  openai_api_key: ENV.OPENAI_API_KEY,
  openai_organization_id: ENV.OPENAI_ORG_ID,

  // Used by the `openai` Node.js API:
  organization: ENV.OPENAI_ORG_ID,
  apiKey: ENV.OPENAI_API_KEY,
}
