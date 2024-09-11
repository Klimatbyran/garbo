import * as DeepL from 'deepl-node'
import { z } from 'zod'
import { fileURLToPath } from 'url'

const envSchema = z.object({
  DEEPL_API_KEY: z.string(),
})

const ENV = envSchema.parse(process.env)

let deeplTranslate: DeepL.Translator

export const translateWithDeepL = async (
  texts: string[],
  sourceLang: DeepL.SourceLanguageCode | null = 'en',
  toLang: DeepL.TargetLanguageCode
) => {
  deeplTranslate ??= new DeepL.Translator(ENV.DEEPL_API_KEY)
  const translatedTexts = await deeplTranslate.translateText(
    texts,
    sourceLang,
    toLang
  )
  return Array.isArray(translatedTexts)
    ? translatedTexts.map(({ text }) => text)
    : [translatedTexts]
}

/**
 * Check if this script was called directly. Should be called with `import.meta.url`
 */
export function isMainModule(importMetaURL: string) {
  if (importMetaURL.startsWith('file:')) {
    return process.argv[1] === fileURLToPath(importMetaURL)
  }
}
