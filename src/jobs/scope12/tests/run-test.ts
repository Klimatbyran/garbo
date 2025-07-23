import { testAccuracy } from "./accuracy"
import { correctResult, newSchema } from "./data"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const runTest = async () => {
  console.log("🧪 Running accuracy test with markdown from file...")
  
  // Read markdown from file
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const markdownPath = join(__dirname, 'markdown.txt')
  const markdown = readFileSync(markdownPath, 'utf-8')
  
  console.log(`📄 Read markdown from: ${markdownPath}`)
  console.log(`📝 Markdown length: ${markdown.length} characters`)
  
  const result = await testAccuracy(
    markdown, 
    correctResult, 
    newSchema,
    10,
    "markdown_file_test"
  )
  
  console.log(`\n✅ Test completed! Accuracy: ${result.accuracy.toFixed(1)}%`)
}

runTest().catch(console.error) 