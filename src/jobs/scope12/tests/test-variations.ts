import { oldSchema, newSchema } from "./data"
import { prompt as basePrompt } from "../prompt"

// Test variations - edit this file to add/remove/modify test cases
export const testVariations = [
  {
    name: "old_schema",
    prompt: basePrompt,
    schema: oldSchema
  },
  {
    name: "new_schema",
    prompt: basePrompt,
    schema: newSchema
  }
];