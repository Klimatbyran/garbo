import { z } from 'zod'

export interface AskOptions {
  model?: string
  temperature?: number
  max_tokens?: number
  baseURL?: string
  apiKey?: string
}

export interface TestSuite {
  expectedResults: {
    [key: string]: any
  }
  testFileMapping?: {
    [fileName: string]: string
  }
  testVariations: Array<{
    name: string
    prompt: string
    schema: z.ZodSchema
    baseline?: boolean
    askOptions?: AskOptions
  }>
}

export interface TestFile {
  name: string
  markdown: string
  expectedResult: any
}

export interface ComparisonOptions {
  yearsToCheck?: number[]
  fileNamesToCheck?: string[]
  runsPerTest?: number
  dataKey?: string // e.g. "scope12" (default) or "scope3"
}

export interface ComparisonConfig {
  prompts: Array<{
    name: string
    prompt: string
    schema: z.ZodSchema
    baseline?: boolean
  }>
  testFiles: TestFile[]
  baseSchema: z.ZodSchema
  runsPerTest: number
  outputDir: string
  yearsToCheck: number[]
  fileNamesToCheck: string[]
  dataKey: string // which top-level key contains the yearly array
}

export interface ParsedArguments {
  suiteName: string
  options: ComparisonOptions
}
