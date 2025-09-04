import { z } from "zod"
import type { TestSuite } from "../../promptTestingFramework/generic-run-comparison"
import { newSchemaWithInstructionsArrayOfExplanations, oldSchema } from "./testData"
import { expectedResults } from "./expected-results"
import { 
  prompt,
    bothMBandLBtestVattenfall
  } from "../prompt"

export const testSuite: TestSuite = {
  expectedResults,
  testVariations: [
    {
      name: "collection of prompt improvements",
      prompt: bothMBandLBtestVattenfall,
      schema: newSchemaWithInstructionsArrayOfExplanations,
    }, 
    {
      name: "original prompt",
      prompt: prompt,
      schema: oldSchema,
    }
  ]
} 