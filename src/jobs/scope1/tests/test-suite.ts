import { z } from "zod"
import type { TestSuite } from "../../promptTestingFramework/types"
import { newSchemaWithInstructionsArrayOfExplanations, oldSchema, recencyPrompt, schemaRecency } from "./testData"
import { expectedResults } from "./expected-results"
import { 
  promptScope1,
  } from "../prompt"
import { schemaScope1 } from "../schema"

export const testSuite: TestSuite = {
  expectedResults,
  testVariations: [
    {
      name: "only scope 1",
      prompt: promptScope1,
      schema: schemaScope1,
    },
  ]
} 
