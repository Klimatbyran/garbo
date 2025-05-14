export default {
  apiKey: process.env.HEYGEN_API_KEY || '',
  baseUrl: 'https://api.heygen.com',
  avatarId: process.env.HEYGEN_AVATAR_ID || 'Lina_Dress_Sitting_Side_public', // Default avatar
  voiceId: process.env.HEYGEN_VOICE_ID || '119caed25533477ba63822d5d1552d25', // Default voice
  dimension: {
    width: 1280,
    height: 720
  },
  avatarStyle: 'normal',
  voiceSpeed: 1.0
}
