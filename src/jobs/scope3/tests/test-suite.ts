import type { TestSuite } from "../../promptTestingFramework/types"
import { expectedResults } from "./expected-results"
import { prompt } from "../prompt"

import { 
  schemaWithSubValuesForCategory,
  summarizePrompt,
  } from "./testData"

export const testSuite: TestSuite = {
  expectedResults,
  testVariations: [
    {
      name: "baseline scope 3 prompt",
      prompt: summarizePrompt,
      schema: schemaWithSubValuesForCategory,
    }, 

  ]
} 