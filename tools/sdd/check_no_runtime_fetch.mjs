import { readFileSync } from 'node:fs'

const distPath = 'dist/en-lightbox.js'
const dist = readFileSync(distPath, 'utf-8')

const forbidden = [
  /fetch\s*\(/,
  /XMLHttpRequest/,
  /import\s*\(\s*['"`]https?:/,
  /url\s*\(\s*['"`]?https?:/,
]

for (const re of forbidden) {
  if (re.test(dist)) {
    console.error(`no-runtime-fetch FAIL: dist contains forbidden pattern ${re}`)
    process.exit(1)
  }
}

console.log('no-runtime-fetch OK')
