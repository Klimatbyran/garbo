import { readFileSync, existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { TestFile, TestSuite } from './types'

export const DEFAULT_RUNS_PER_TEST = 1
export const SUPPORTED_FILE_EXTENSIONS = ['.md', '.txt']

export const getCurrentDir = (): string => {
  return dirname(fileURLToPath(import.meta.url))
}

export const isValidYear = (year: number): boolean => {
  return !isNaN(year) && year > 1900 && year < 2100
}

export const isValidFileName = (fileName: string): boolean => {
  return fileName.length > 0 && /^[a-zA-Z0-9_-]+$/.test(fileName)
}

export const calculateAverage = (numbers: number[]): number => {
  return numbers.length > 0
    ? numbers.reduce((a, b) => a + b, 0) / numbers.length
    : 0
}

export const loadTestSuite = async (suiteName: string): Promise<TestSuite> => {
  try {
    const testsPath = `../${suiteName}/tests`
    const testSuiteModule = await import(`${testsPath}/test-suite`)

    if (!testSuiteModule.testSuite) {
      throw new Error(
        `Test suite '${suiteName}' does not export a 'testSuite' object`
      )
    }

    return testSuiteModule.testSuite
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to load test suite '${suiteName}': ${errorMessage}`)
  }
}

export const getInputDirectory = (suiteName: string): string => {
  const currentDir = getCurrentDir()
  return join(currentDir, '..', suiteName, 'tests', 'input')
}

export const shouldIncludeFile = (
  fileName: string,
  fileNamesToCheck: string[]
): boolean => {
  if (fileNamesToCheck.length === 0) return true
  return fileNamesToCheck.includes(fileName)
}

export const getExpectedResultKey = (
  baseName: string,
  testSuite: TestSuite
): string => {
  return testSuite.testFileMapping?.[baseName] || baseName
}

export const filterExpectedResultByYears = (
  expectedResult: any,
  yearsToCheck: number[],
  dataKey: string,
): any => {
  if (
    yearsToCheck.length === 0 ||
    !expectedResult ||
    !Array.isArray(expectedResult[dataKey])
  ) {
    return expectedResult
  }

  return {
    ...expectedResult,
    [dataKey]: expectedResult[dataKey].filter((item: any) =>
      yearsToCheck.includes(item.year)
    ),
  }
}

export const loadTestFile = (
  filePath: string,
  baseName: string,
  testSuite: TestSuite,
  yearsToCheck: number[],
  dataKey: string,
): TestFile | null => {
  try {
    const markdown = readFileSync(filePath, 'utf-8')
    const expectedResultKey = getExpectedResultKey(baseName, testSuite)
    const expectedResult = testSuite.expectedResults[expectedResultKey]

    if (!expectedResult) {
      console.warn(
        `⚠️  No expected result found for ${baseName} (key: ${expectedResultKey})`
      )
      return null
    }

    const filteredExpectedResult = filterExpectedResultByYears(
      expectedResult,
      yearsToCheck,
      dataKey
    )

    console.log(
      `✅ Loaded test file: ${baseName} (expected: ${expectedResultKey})`
    )

    return {
      name: baseName,
      markdown,
      expectedResult: filteredExpectedResult,
    }
  } catch (error) {
    console.error(`❌ Error loading ${filePath}:`, error)
    return null
  }
}

export const loadTestFiles = (
  suiteName: string,
  testSuite: TestSuite,
  yearsToCheck: number[],
  fileNamesToCheck: string[],
  dataKey: string,
): TestFile[] => {
  const inputDir = getInputDirectory(suiteName)

  if (!existsSync(inputDir)) {
    console.error(`Input directory does not exist: ${inputDir}`)
    return []
  }

  const files = readdirSync(inputDir).sort()
  const testFiles: TestFile[] = []

  console.log(`🔍 Found ${files.length} files in input directory`)
  console.log(
    `🎯 Looking for files: ${fileNamesToCheck.length > 0 ? fileNamesToCheck.join(', ') : 'ALL FILES'}`
  )

  for (const file of files) {
    const fileExtension = file.substring(file.lastIndexOf('.'))

    if (!SUPPORTED_FILE_EXTENSIONS.includes(fileExtension)) {
      continue
    }

    const baseName = file.replace(/\.(md|txt)$/, '')

    if (!shouldIncludeFile(baseName, fileNamesToCheck)) {
      continue
    }

    const markdownPath = join(inputDir, file)
    const testFile = loadTestFile(
      markdownPath,
      baseName,
      testSuite,
      yearsToCheck,
      dataKey
    )

    if (testFile) {
      testFiles.push(testFile)
    }
  }

  return testFiles
}
