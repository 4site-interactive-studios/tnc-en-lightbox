import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'))
const deps = pkg.dependencies ?? {}

if (Object.keys(deps).length > 0) {
  console.error(
    `no-runtime-deps FAIL: runtime dependencies found: ${Object.keys(deps).join(', ')}`,
  )
  process.exit(1)
}
console.log('no-runtime-deps OK')
