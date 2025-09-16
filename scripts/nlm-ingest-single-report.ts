import { readFile, writeFile } from 'node:fs/promises'

(async () => {
  const input = process.argv[2] || 'https://vp165.alertir.com/afw/files/press/holmen/202503067047-1.pdf'
  const outPath = process.argv[3] || 'nlm-ingest-result.json'

  let blob: Blob
  if (/^https?:\/\//i.test(input)) {
    const r = await fetch(input)
    if (!r.ok) throw new Error(`Failed to fetch URL: ${r.status} ${r.statusText}`)
    const ab = await r.arrayBuffer()
    blob = new Blob([Buffer.from(ab)], { type: 'application/pdf' })
  } else {
    const buf = await readFile(input)
    blob = new Blob([buf], { type: 'application/pdf' })
  }

  const fd = new FormData()
  fd.append('file', blob, 'report.pdf')

  const res = await fetch('http://localhost:5001/api/parseDocument?renderFormat=json', {
    method: 'POST',
    body: fd,
  })
  if (!res.ok) throw new Error(`Ingestor error: ${res.status} ${res.statusText}`)
  const json = await res.json()
  await writeFile(outPath, JSON.stringify(json, null, 2), 'utf-8')
  console.log(`Saved result to ${outPath}`)
})()