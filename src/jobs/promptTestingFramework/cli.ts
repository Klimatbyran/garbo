import { ParsedArguments, ComparisonOptions } from './types'
import { isValidFileName, isValidYear } from './utils'

export const parseArgs = (args: string[]): ParsedArguments => {
  if (args.length === 0) {
    throw new Error('Suite name is required')
  }

  const suiteName = args[0]
  const options: ComparisonOptions = {}

  for (let i = 1; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--years': {
        const years = args[i + 1]?.split(',').map((y) => parseInt(y.trim()))
        if (years && years.every((y) => isValidYear(y))) {
          options.yearsToCheck = years
        }
        i++
        break
      }
      case '--files': {
        const files = args[i + 1]?.split(',').map((f) => f.trim())
        if (files && files.every((f) => isValidFileName(f))) {
          options.fileNamesToCheck = files
        }
        i++
        break
      }
      case '--runs': {
        const runs = parseInt(args[i + 1])
        if (!isNaN(runs) && runs > 0) {
          options.runsPerTest = runs
        }
        i++
        break
      }
      default:
        // ignore unknown args; keeps parser tolerant
        break
    }
  }

  return { suiteName, options }
}
