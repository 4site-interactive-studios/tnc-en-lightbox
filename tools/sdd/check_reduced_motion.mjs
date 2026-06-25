import { readFileSync } from 'node:fs'

const distPath = 'dist/en-lightbox.js'
const css = readFileSync(distPath, 'utf-8')

const reduceRe = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{([^}]*)\}/g
const motionRe = /(transition\s*:|animation\s*:|@keyframes\s+)/g

const reduceBlocks = []
let m
while ((m = reduceRe.exec(css)) !== null) {
  reduceBlocks.push(m[1])
}

const motionMatches = []
while ((m = motionRe.exec(css)) !== null) {
  motionMatches.push(m.index)
}

if (motionMatches.length === 0) {
  console.error('reduced-motion-guard FAIL: no motion (transition/animation/@keyframes) found in CSS')
  process.exit(1)
}

for (const idx of motionMatches) {
  const insideReduce = reduceBlocks.some((block) => {
    const start = css.indexOf(block)
    return idx >= start && idx <= start + block.length
  })
  if (!insideReduce) {
    console.error(`reduced-motion-guard FAIL: motion at offset ${idx} is not inside a prefers-reduced-motion:reduce media query`)
    process.exit(1)
  }
}

console.log(`reduced-motion-guard OK: ${motionMatches.length} motion rule(s) guarded`)
