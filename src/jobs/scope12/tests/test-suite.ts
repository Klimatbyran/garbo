import { z } from "zod"
import type { TestSuite } from "../../promptTestingFramework/types"
import { newSchemaWithInstructionsArrayOfExplanations, oldSchema } from "./testData"
import { expectedResults } from "./expected-results"
import { 
  prompt,
    oldPrompt
  } from "../prompt"

export const testSuite: TestSuite = {
  expectedResults,
  testVariations: [
    {
      name: "prompt improvements",
      prompt: prompt,
      schema: newSchemaWithInstructionsArrayOfExplanations,
    }
  ]
} 
