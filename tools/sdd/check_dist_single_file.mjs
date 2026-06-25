import { readdirSync } from 'node:fs'

const files = readdirSync('dist').sort()
const expected = ['en-lightbox.js']

if (files.length !== expected.length || files.some((f, i) => f !== expected[i])) {
  console.error(`dist-single-file FAIL: dist contains [${files.join(', ')}], expected [${expected.join(', ')}]`)
  process.exit(1)
}

console.log('dist-single-file OK')
