import { JSDOM } from 'jsdom'
import { readFileSync } from 'node:fs'

const dist = readFileSync('dist/en-lightbox.js', 'utf-8')

const html = `
<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>EN Lightbox A11y Audit</title></head>
  <body>
    <button id="trigger" type="button">Open</button>
    <script>
      window.ENLightbox = {
        header: 'A11y audit header',
        body: 'A11y audit body text.',
        image: { src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', alt: '' },
        cta: { label: 'Primary CTA', href: '#' },
        secondaryCta: { label: 'Secondary CTA', href: '#secondary' },
      };
    </script>
    <script>${dist}</script>
  </body>
</html>
`

const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://example.org/' })
const { window } = dom

globalThis.window = window
globalThis.document = window.document

const { default: axe } = await import('axe-core')

window.ENLightboxAPI.open()

const results = await axe.run(window.document)

if (results.violations.length > 0) {
  console.error('a11y-audit FAIL: axe violations found')
  for (const v of results.violations) {
    console.error(`  ${v.id}: ${v.help} (${v.nodes.length} nodes)`)
  }
  process.exit(1)
}

console.log(`a11y-audit OK: ${results.passes.length} passes, 0 violations`)
