import { extractDataFromUrl } from '../utils/extractWithAI'
import { prompt } from './prompt'
import { queryTexts } from './queryTexts'
import { schema } from './schema'

export const extractScope12 = async (url: string) => {
  const response = await extractDataFromUrl(
    url,
    'scope12',
    prompt,
    schema,
    queryTexts
  )
  return response
}
