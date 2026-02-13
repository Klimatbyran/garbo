import sv from '../../output/sv/industry-gics.json'
import en from '../../output/en/industry-gics.json'

export function getGics(code: string) {
  return {
    sv: sv[code],
    en: en[code],
  }
}
