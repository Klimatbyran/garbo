import { readFile } from "fs/promises"
import { resolve } from "path"
import { DoclingDocumentSchema } from "./lib/docling-schema"

async function main() {
  const file = await readFile(
    resolve(import.meta.dirname, "../scratch/Vestum-arsredovisning-2023.json"),
    { encoding: "utf-8" }
  ).then(JSON.parse)

  const TablesSchema = DoclingDocumentSchema.pick({ tables: true })

  const document = TablesSchema.parse(file)
  const uniquePages = new Set(
    document.tables.map((t) => t.prov.at(0)?.page_no).filter(Number.isFinite)
  )

  // with accurate parsing: 108 tables on 42 unique pages - 300 seconds => 5 min
  // with fast parsing:			108 tables on 42 unique pages - 175 seconds => 3 min
  console.dir({
    tables: document.tables.length,
    uniquePages,
  })
}

await main()
