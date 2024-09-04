import sv from '../../output/sv/industry-gics.json'
import en from '../../output/en/industry-gics.json'

export function getGics(code) {
  return {
    sv: sv.find((item) => item.subIndustryCode === code),
    en: en.find((item) => item.subIndustryCode === code),
  }
}
