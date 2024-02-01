export default {
  path: process.env.CHROMA_HOST || 'http://127.0.0.1:8000',
  auth: process.env.CHROMA_TOKEN
    ? {
        provider: 'token',
        credentials: process.env.CHROMA_TOKEN || '',
      }
    : undefined,
}
