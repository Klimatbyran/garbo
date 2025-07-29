import { runComparisonTest, printComparisonSummary } from "./comparison-test"
import { readFileSync, existsSync, readdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { z } from "zod"

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface TestSuite {
  expectedResults: {
    [key: string]: any;
  };
  testFileMapping?: {
    [fileName: string]: string;
  };
  testVariations: Array<{
    name: string;
    prompt: string;
    schema: z.ZodSchema;
    baseline?: boolean;
  }>;
}

export interface TestFile {
  name: string;
  markdown: string;
  expectedResult: any;
}

export interface ComparisonOptions {
  yearsToCheck?: number[];
  fileNamesToCheck?: string[];
  runsPerTest?: number;
}

export interface ComparisonConfig {
  prompts: Array<{
    name: string;
    prompt: string;
    schema: z.ZodSchema;
    baseline?: boolean;
  }>;
  testFiles: TestFile[];
  baseSchema: z.ZodSchema;
  runsPerTest: number;
  outputDir: string;
  yearsToCheck: number[];
  fileNamesToCheck: string[];
}

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

const DEFAULT_RUNS_PER_TEST = 1;
const SUPPORTED_FILE_EXTENSIONS = ['.md', '.txt'];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getCurrentDir = (): string => {
  return dirname(fileURLToPath(import.meta.url));
};

const isValidYear = (year: number): boolean => {
  return !isNaN(year) && year > 1900 && year < 2100;
};

const isValidFileName = (fileName: string): boolean => {
  return fileName.length > 0 && /^[a-zA-Z0-9_-]+$/.test(fileName);
};

const calculateAverage = (numbers: number[]): number => {
  return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
};

// ============================================================================
// TEST SUITE LOADING
// ============================================================================

const loadTestSuite = async (suiteName: string): Promise<TestSuite> => {
  try {
    const testsPath = `../${suiteName}/tests`;
    const testSuiteModule = await import(`${testsPath}/test-suite`);
    
    if (!testSuiteModule.testSuite) {
      throw new Error(`Test suite '${suiteName}' does not export a 'testSuite' object`);
    }
    
    return testSuiteModule.testSuite;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load test suite '${suiteName}': ${errorMessage}`);
  }
};

// ============================================================================
// TEST FILE LOADING
// ============================================================================

const getInputDirectory = (suiteName: string): string => {
  const currentDir = getCurrentDir();
  return join(currentDir, '..', suiteName, 'tests', 'input');
};

const shouldIncludeFile = (
  fileName: string, 
  fileNamesToCheck: string[]
): boolean => {
  if (fileNamesToCheck.length === 0) return true;
  return fileNamesToCheck.includes(fileName);
};

const getExpectedResultKey = (
  baseName: string, 
  testSuite: TestSuite
): string => {
  return testSuite.testFileMapping?.[baseName] || baseName;
};

const filterExpectedResultByYears = (
  expectedResult: any, 
  yearsToCheck: number[]
): any => {
  if (yearsToCheck.length === 0 || !expectedResult || !Array.isArray(expectedResult.scope12)) {
    return expectedResult;
  }
  
  return {
    ...expectedResult,
    scope12: expectedResult.scope12.filter((item: any) => 
      yearsToCheck.includes(item.year)
    )
  };
};

const loadTestFile = (
  filePath: string, 
  baseName: string, 
  testSuite: TestSuite, 
  yearsToCheck: number[]
): TestFile | null => {
  try {
    const markdown = readFileSync(filePath, 'utf-8');
    const expectedResultKey = getExpectedResultKey(baseName, testSuite);
    const expectedResult = testSuite.expectedResults[expectedResultKey];
    
    if (!expectedResult) {
      console.warn(`⚠️  No expected result found for ${baseName} (key: ${expectedResultKey})`);
      return null;
    }
    
    const filteredExpectedResult = filterExpectedResultByYears(expectedResult, yearsToCheck);
    
    console.log(`✅ Loaded test file: ${baseName} (expected: ${expectedResultKey})`);
    
    return {
      name: baseName,
      markdown,
      expectedResult: filteredExpectedResult
    };
  } catch (error) {
    console.error(`❌ Error loading ${filePath}:`, error);
    return null;
  }
};

const loadTestFiles = (
  suiteName: string, 
  testSuite: TestSuite, 
  yearsToCheck: number[], 
  fileNamesToCheck: string[]
): TestFile[] => {
  const inputDir = getInputDirectory(suiteName);
  
  if (!existsSync(inputDir)) {
    console.error(`Input directory does not exist: ${inputDir}`);
    return [];
  }
  
  const files = readdirSync(inputDir);
  const testFiles: TestFile[] = [];
  
  console.log(`🔍 Found ${files.length} files in input directory`);
  console.log(`🎯 Looking for files: ${fileNamesToCheck.length > 0 ? fileNamesToCheck.join(', ') : 'ALL FILES'}`);
  
  for (const file of files) {
    const fileExtension = file.substring(file.lastIndexOf('.'));
    
    if (!SUPPORTED_FILE_EXTENSIONS.includes(fileExtension)) {
      continue;
    }
    
    const baseName = file.replace(/\.(md|txt)$/, '');
    
    console.log(`📄 Processing file: ${baseName}`);
    
    if (!shouldIncludeFile(baseName, fileNamesToCheck)) {
      console.log(`⏭️  Skipping ${baseName} (not in specified files)`);
      continue;
    }
    
    const markdownPath = join(inputDir, file);
    const testFile = loadTestFile(markdownPath, baseName, testSuite, yearsToCheck);
    
    if (testFile) {
      testFiles.push(testFile);
    }
  }
  
  console.log(`✅ Loaded ${testFiles.length} test files: ${testFiles.map(f => f.name).join(', ')}`);
  return testFiles;
};

// ============================================================================
// CONFIGURATION BUILDING
// ============================================================================

const buildComparisonConfig = (
  suiteName: string,
  testSuite: TestSuite,
  testFiles: TestFile[],
  options: ComparisonOptions
): ComparisonConfig => {
  const { yearsToCheck = [], fileNamesToCheck = [], runsPerTest = DEFAULT_RUNS_PER_TEST } = options;
  
  if (testSuite.testVariations.length === 0) {
    throw new Error(`Test suite '${suiteName}' has no test variations defined`);
  }
  
  return {
    prompts: testSuite.testVariations,
    testFiles,
    baseSchema: testSuite.testVariations[0].schema,
    runsPerTest,
    outputDir: `../${suiteName}/tests/comparison_results`,
    yearsToCheck,
    fileNamesToCheck
  };
};

// ============================================================================
// CLI PARSING
// ============================================================================

interface ParsedArguments {
  suiteName: string;
  options: ComparisonOptions;
}

const parseCommandLineArguments = (args: string[]): ParsedArguments => {
  if (args.length === 0) {
    throw new Error("Suite name is required");
  }
  
  const suiteName = args[0];
  const options: ComparisonOptions = {};
  
  console.log(`🔧 Parsing CLI arguments: ${args.join(' ')}`);
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--years':
        const years = args[i + 1]?.split(',').map(y => parseInt(y.trim()));
        if (years && years.every(y => isValidYear(y))) {
          options.yearsToCheck = years;
          console.log(`📅 Parsed years: ${years.join(', ')}`);
        } else {
          console.warn("⚠️  Invalid years provided, ignoring --years option");
        }
        i++;
        break;
        
      case '--files':
        const files = args[i + 1]?.split(',').map(f => f.trim());
        if (files && files.every(f => isValidFileName(f))) {
          options.fileNamesToCheck = files;
          console.log(`📁 Parsed files: ${files.join(', ')}`);
        } else {
          console.warn("⚠️  Invalid file names provided, ignoring --files option");
        }
        i++;
        break;
        
      case '--runs':
        const runs = parseInt(args[i + 1]);
        if (isValidYear(runs) && runs > 0) {
          options.runsPerTest = runs;
          console.log(`🔄 Parsed runs: ${runs}`);
        } else {
          console.warn("⚠️  Invalid runs count provided, using default");
        }
        i++;
        break;
        
      default:
        console.warn(`⚠️  Unknown argument: ${arg}`);
    }
  }
  
  return { suiteName, options };
};

// ============================================================================
// MAIN EXECUTION
// ============================================================================

const runGenericComparison = async (
  suiteName: string, 
  options: ComparisonOptions
): Promise<void> => {
  console.log(`🚀 Starting prompt comparison test for suite: ${suiteName}...`);
  
  const { yearsToCheck = [], fileNamesToCheck = [], runsPerTest = DEFAULT_RUNS_PER_TEST } = options;
  
  // Log configuration
  if (fileNamesToCheck.length > 0) {
    console.log(`🎯 Testing only files: ${fileNamesToCheck.join(', ')}`);
  }
  if (yearsToCheck.length > 0) {
    console.log(`📅 Testing only years: ${yearsToCheck.join(', ')}`);
  }
  console.log(`🔄 Runs per test: ${runsPerTest}`);
  
  // Load test suite and files
  const testSuite = await loadTestSuite(suiteName);
  const testFiles = loadTestFiles(suiteName, testSuite, yearsToCheck, fileNamesToCheck);
  
  if (testFiles.length === 0) {
    console.error("❌ No test files found. Please add .md/.txt files with corresponding expected results to the input/ directory");
    return;
  }
  
  // Build configuration and run tests
  const config = buildComparisonConfig(suiteName, testSuite, testFiles, options);
  const report = await runComparisonTest(config);
  
  // Print summary
  printComparisonSummary(report, config);
  
  console.log("\n🎉 Comparison test completed!");
  console.log(`📊 Total tests run: ${config.prompts.length * config.testFiles.length * config.runsPerTest}`);
};

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

const main = async (): Promise<void> => {
  try {
    const args = process.argv.slice(2);
    const { suiteName, options } = parseCommandLineArguments(args);
    
    await runGenericComparison(suiteName, options);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error running comparison test: ${errorMessage}`);
    
    if (error instanceof Error && error.message.includes("Suite name is required")) {
      console.error("\nUsage: npm run test:comparison <suite-name> [options]");
      console.error("Example: npm run test:comparison scope12 --years 2024 --files rise,catena");
    }
    
    process.exit(1);
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export { runGenericComparison, loadTestSuite };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
} 