import { extractDataFromUrl } from '../utils/extractWithAI'
import { prompt } from './prompt'
import { queryTexts } from './queryTexts'
import { schema } from './schema'

export const extractScope3 = async (url: string) => {
  const response = await extractDataFromUrl(
    url,
    'scope3',
    prompt,
    schema,
    queryTexts
  )
  return response
}
