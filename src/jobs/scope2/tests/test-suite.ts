import { z } from "zod"
import type { TestSuite } from "../../promptTestingFramework/types"
import { newSchemaWithInstructionsArrayOfExplanations, oldSchema, recencyPrompt, schemaRecency } from "./testData"
import { expectedResults } from "./expected-results"
import { 
  promptScope2Only,
  } from "../prompt"
import { schemaScope2Only } from "../schema"

export const testSuite: TestSuite = {
  expectedResults,
  testVariations: [
    {
      name: "scope 2 only",
      prompt: promptScope2Only,
      schema: schemaScope2Only,
    },
  ]
} 
