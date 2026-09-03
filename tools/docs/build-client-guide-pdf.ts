#!/usr/bin/env node
/**
 * build-client-guide-pdf.ts — renders CLIENT_GUIDE.md to docs/TNC-EN-Lightbox-Client-Guide.pdf.
 *
 * Zero new dependencies: a small hand-written Markdown -> HTML converter covering exactly the
 * constructs CLIENT_GUIDE.md uses (ATX headings h1-h4, paragraphs, `---` rules, fenced code with
 * language, inline code, bold, italics, nested ordered/unordered lists, pipe tables with header
 * row, `[text](url)` links including `#anchor` links, blockquotes) plus Playwright's bundled
 * Chromium for the print. No network access at build time: system font stack, no external assets.
 *
 * Self-checks (fail the build): every `#anchor` TOC target must resolve to a generated heading id,
 * the four `### Example` headings must exist, the CDN URL must appear, and no raw Markdown
 * artifacts may survive in the rendered text.
 */
import { chromium } from '@playwright/test'
import * as fs from 'node:fs'

const SRC = 'CLIENT_GUIDE.md'
const OUT = 'docs/TNC-EN-Lightbox-Client-Guide.pdf'
const CDN_URL_NEEDLE = 'rackcdn.com/2246/en-lightbox.js'

interface Heading {
  level: number
  text: string
  id: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** GitHub slug rule: lowercase, strip punctuation except hyphens, each space -> hyphen. */
function githubSlug(text: string, used: Map<string, number>): string {
  const base = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s/g, '-')
  const seen = used.get(base) ?? 0
  used.set(base, seen + 1)
  return seen === 0 ? base : `${base}-${seen}`
}

function renderInline(input: string): string {
  // Extract code spans first (private-use placeholders) so their contents are escaped once and
  // never re-processed by the link/bold/italic passes.
  const codeSpans: string[] = []
  let text = input.replace(/`([^`]+)`/g, (_m, code: string) => {
    codeSpans.push(`<code>${escapeHtml(code)}</code>`)
    return `\uE000${codeSpans.length - 1}\uE001`
  })
  text = escapeHtml(text)
  text = text.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_m, label: string, href: string) => `<a href="${href}">${label}</a>`,
  )
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  return text.replace(/\uE000(\d+)\uE001/g, (_m, i: string) => codeSpans[Number(i)])
}

function splitTableRow(line: string): string[] {
  let s = line.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|')) s = s.slice(1)
  return s.split('|').map((c) => c.trim())
}

function isTableDelimiter(line: string): boolean {
  return /^\|?[\s:|-]+\|?$/.test(line.trim()) && line.includes('-')
}

function isBlockStart(lines: string[], i: number): boolean {
  const line = lines[i]
  if (/^```/.test(line)) return true
  if (/^#{1,4}\s/.test(line)) return true
  if (/^-{3,}\s*$/.test(line)) return true
  if (/^>/.test(line)) return true
  if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) return true
  if (line.startsWith('|') && i + 1 < lines.length && isTableDelimiter(lines[i + 1])) return true
  return false
}

function renderList(lines: string[], start: number): { html: string; next: number } {
  interface Frame {
    indent: number
    type: 'ul' | 'ol'
    liOpen: boolean
  }
  const stack: Frame[] = []
  const out: string[] = []
  const closeLi = () => {
    const top = stack[stack.length - 1]
    if (top && top.liOpen) {
      out.push('</li>')
      top.liOpen = false
    }
  }
  let i = start
  for (; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '') break
    const m = line.match(/^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/)
    if (m) {
      const indent = m[1].length
      const type: 'ul' | 'ol' = /\d/.test(m[2]) ? 'ol' : 'ul'
      while (stack.length > 0 && stack[stack.length - 1].indent > indent) {
        closeLi()
        const f = stack.pop()
        if (f) out.push(`</${f.type}>`)
      }
      const top = stack[stack.length - 1]
      if (!top || top.indent < indent) {
        out.push(`<${type}>`)
        stack.push({ indent, type, liOpen: false })
      } else if (top.type !== type) {
        closeLi()
        const f = stack.pop()
        if (f) out.push(`</${f.type}>`)
        out.push(`<${type}>`)
        stack.push({ indent, type, liOpen: false })
      }
      closeLi()
      out.push(`<li>${renderInline(m[3].trim())}`)
      stack[stack.length - 1].liOpen = true
    } else if (stack.length > 0 && /^\s/.test(line)) {
      // Continuation line belonging to the current list item.
      out.push(` ${renderInline(line.trim())}`)
    } else {
      break
    }
  }
  while (stack.length > 0) {
    closeLi()
    const f = stack.pop()
    if (f) out.push(`</${f.type}>`)
  }
  return { html: out.join('\n'), next: i }
}

function renderMarkdown(md: string): { body: string; headings: Heading[]; title: string } {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  const headings: Heading[] = []
  const usedSlugs = new Map<string, number>()
  let title = ''
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() === '') {
      i++
      continue
    }
    const fence = line.match(/^```(\w*)\s*$/)
    if (fence) {
      const lang = fence[1]
      const buf: string[] = []
      i++
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i])
        i++
      }
      i++ // closing fence
      out.push(
        `<pre><code${lang ? ` class="language-${lang}"` : ''}>${escapeHtml(buf.join('\n'))}</code></pre>`,
      )
      continue
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      const level = h[1].length
      const raw = h[2].trim()
      const id = githubSlug(raw, usedSlugs)
      headings.push({ level, text: raw, id })
      if (title === '' && level === 1) title = raw
      out.push(`<h${level} id="${id}">${renderInline(raw)}</h${level}>`)
      i++
      continue
    }
    if (/^-{3,}\s*$/.test(line)) {
      out.push('<hr>')
      i++
      continue
    }
    if (line.startsWith('|') && i + 1 < lines.length && isTableDelimiter(lines[i + 1])) {
      const header = splitTableRow(line)
      i += 2 // header + delimiter
      const rows: string[][] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        rows.push(splitTableRow(lines[i]))
        i++
      }
      const thead = `<thead><tr>${header.map((c) => `<th>${renderInline(c)}</th>`).join('')}</tr></thead>`
      const tbody = rows
        .map((r) => `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join('')}</tr>`)
        .join('\n')
      out.push(`<table>\n${thead}\n<tbody>\n${tbody}\n</tbody>\n</table>`)
      continue
    }
    if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
      const r = renderList(lines, i)
      out.push(r.html)
      i = r.next
      continue
    }
    if (line.startsWith('>')) {
      const buf: string[] = []
      while (i < lines.length && lines[i].startsWith('>')) {
        buf.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      out.push(`<blockquote><p>${renderInline(buf.join(' ').trim())}</p></blockquote>`)
      continue
    }
    const buf: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !isBlockStart(lines, i)) {
      buf.push(lines[i].trim())
      i++
    }
    out.push(`<p>${renderInline(buf.join(' '))}</p>`)
  }
  return { body: out.join('\n'), headings, title }
}

const CSS = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #1a1a1a;
  }
  h1 { font-size: 20pt; margin: 0 0 12pt; }
  h2 { font-size: 15pt; margin: 18pt 0 6pt; padding-bottom: 3pt; border-bottom: 1px solid #d0d7de; }
  h3 { font-size: 12.5pt; margin: 14pt 0 4pt; }
  h4 { font-size: 11pt; margin: 12pt 0 4pt; }
  h1, h2, h3, h4 { page-break-after: avoid; }
  p { margin: 0 0 8pt; }
  a { color: #1a5fb4; text-decoration: none; }
  hr { border: none; border-top: 1px solid #d0d7de; margin: 16pt 0; }
  code {
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
    font-size: 9.5pt;
    background: #f3f4f6;
    padding: 0.1em 0.3em;
    border-radius: 3px;
    overflow-wrap: anywhere;
  }
  pre {
    background: #f6f8fa;
    border: 1px solid #e1e4e8;
    border-radius: 6px;
    padding: 10px 12px;
    margin: 0 0 10pt;
    page-break-inside: avoid;
  }
  pre code {
    background: transparent;
    padding: 0;
    font-size: 9pt;
    white-space: pre-wrap;
    word-break: break-all;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 0 0 10pt;
    font-size: 10pt;
    page-break-inside: avoid;
  }
  th, td {
    border: 1px solid #d0d7de;
    padding: 5px 8px;
    text-align: left;
    vertical-align: top;
  }
  th { background: #f0f2f5; }
  ul, ol { margin: 0 0 8pt; padding-left: 22pt; }
  li { margin-bottom: 2pt; }
  blockquote {
    margin: 0 0 8pt;
    padding-left: 12px;
    border-left: 3px solid #d0d7de;
    color: #555;
  }
`

async function main(): Promise<void> {
  const md = fs.readFileSync(SRC, 'utf8')
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { version: string }
  const { body, headings, title } = renderMarkdown(md)

  // --- Self-checks on the source/AST side ---
  const anchorTargets = [...md.matchAll(/\]\(#([^)]+)\)/g)].map((m) => m[1])
  const ids = new Set(headings.map((h) => h.id))
  const missing = anchorTargets.filter((t) => !ids.has(t))
  if (missing.length > 0) {
    throw new Error(`TOC anchor(s) with no matching heading id: ${[...new Set(missing)].join(', ')}`)
  }
  const exampleHeadings = headings.filter((h) => h.level === 3 && /^Example \d/.test(h.text))
  if (exampleHeadings.length !== 4) {
    throw new Error(`expected 4 '### Example' headings, found ${exampleHeadings.length}`)
  }
  if (!body.includes(CDN_URL_NEEDLE)) {
    throw new Error(`CDN URL '${CDN_URL_NEEDLE}' missing from rendered HTML`)
  }

  const doc = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)} — TNC EN Lightbox Client Guide</title>
<style>${CSS}</style>
</head>
<body>
${body}
</body>
</html>`

  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.setContent(doc, { waitUntil: 'load' })

    // --- Self-check on the rendered text: no raw Markdown artifacts survive ---
    const renderedText = await page.evaluate(() => document.body.innerText)
    for (const artifact of ['**', '```', '|---|']) {
      if (renderedText.includes(artifact)) {
        throw new Error(`raw Markdown artifact survived in rendered text: '${artifact}'`)
      }
    }

    const footer = `<div style="font-size:8px; color:#666; width:100%; padding:0 18mm; display:flex; justify-content:space-between;">
  <span>TNC EN Lightbox — Client Guide · v${pkg.version}</span>
  <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
</div>`

    fs.mkdirSync('docs', { recursive: true })
    await page.pdf({
      path: OUT,
      format: 'Letter',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: footer,
      margin: { top: '18mm', bottom: '18mm', left: '18mm', right: '18mm' },
    })
  } finally {
    await browser.close()
  }

  const bytes = fs.statSync(OUT).size
  const pdfText = fs.readFileSync(OUT).toString('latin1')
  const pageMarkers = pdfText.match(/\/Type\s*\/Pages?/g) ?? []
  const pageCount = pageMarkers.filter((m) => !m.endsWith('s')).length
  console.log(`wrote ${OUT} (${bytes} bytes, ${pageCount} pages)`)
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
