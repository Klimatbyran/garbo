import { z } from "zod"

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

export interface ParsedArguments {
  suiteName: string;
  options: ComparisonOptions;
}


