import { z } from "zod"
import type { TestSuite } from "../../promptTestingFramework/types"
import { newSchemaWithInstructionsArrayOfExplanations, oldSchema, recencyPrompt, schemaRecency } from "./testData"
import { expectedResults } from "./expected-results"
import { 
  prompt,
  promptNew4Dec,
  } from "../prompt"
import { schemaScope1And2 } from "../schema"

export const testSuite: TestSuite = {
  expectedResults,
  testVariations: [
    {
      name: "recency improvements",
      prompt: promptNew4Dec,
      schema: schemaScope1And2,
    },
  ]
} 
