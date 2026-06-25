import { gzipSync } from 'node:zlib'
import { readFileSync } from 'node:fs'

const distPath = 'dist/en-lightbox.js'
const budgetPath = '.agentic/contracts/budgets.json'

const dist = readFileSync(distPath)
const gzipped = gzipSync(dist)
const gzSize = gzipped.length

const budget = JSON.parse(readFileSync(budgetPath, 'utf-8'))
const maxGz = budget.bundleSize.maxGzipBytes

if (gzSize > maxGz) {
  console.error(`bundle-size FAIL: gzip ${gzSize}B exceeds budget ${maxGz}B`)
  process.exit(1)
}
console.log(`bundle-size OK: gzip ${gzSize}B / budget ${maxGz}B`)
