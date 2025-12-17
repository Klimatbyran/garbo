import { z } from "zod"
import type { TestSuite } from "../../promptTestingFramework/types"
import { newSchemaWithInstructionsArrayOfExplanations, oldSchema, recencyPrompt, schemaRecency } from "./testData"
import { expectedResults } from "./expected-results"
import { 
  prompt,
  } from "../prompt"
import { schema } from "../schema"

export const testSuite: TestSuite = {
  expectedResults,
  testVariations: [
    {
      name: "only scope 1",
      prompt: prompt,
      schema: schema,
    },
  ]
} 
