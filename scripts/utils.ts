import * as DeepL from 'deepl-node'
import { z } from 'zod'

const envSchema = z.object({
  DEEPL_API_KEY: z.string(),
})

const ENV = envSchema.parse(process.env)

const deeplTranslate = new DeepL.Translator(ENV.DEEPL_API_KEY)

export const translateWithDeepL = async (
  texts: string[],
  sourceLang: DeepL.SourceLanguageCode | null = 'en',
  toLang: DeepL.TargetLanguageCode
) => {
  const translatedTexts = await deeplTranslate.translateText(
    texts,
    sourceLang,
    toLang
  )
  return Array.isArray(translatedTexts)
    ? translatedTexts.map(({ text }) => text)
    : [translatedTexts]
}
