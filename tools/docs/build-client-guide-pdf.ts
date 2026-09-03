#!/usr/bin/env node
/**
 * build-client-guide-pdf.ts — renders CLIENT_GUIDE.md to docs/TNC-EN-Lightbox-Client-Guide.pdf,
 * styled after the delivered 4Site campaign-guide design (cover page, green section rules, dark
 * code blocks, chip inline code, green-headed tables).
 *
 * Zero new npm dependencies: a small hand-written Markdown -> HTML converter covering exactly the
 * constructs CLIENT_GUIDE.md uses (ATX headings h1-h4, paragraphs, `---` rules, fenced code with
 * language, inline code, bold, italics, nested ordered/unordered lists, pipe tables with header
 * row, `[text](url)` links including `#anchor` links, blockquotes), a minimal syntax tinter for
 * `html`/`javascript`/`js` fences (object keys, string literals, `//` comments — no library), and
 * Playwright's bundled Chromium for the print. No network access at build time: system font stack
 * and local logo files only.
 *
 * One system tool is required beyond node/npm: poppler's `pdfunite` (and `pdfinfo`). Chromium's
 * footerTemplate is drawn on every sheet of a render pass — CSS cannot suppress it for just the
 * cover — so the cover is rendered as its own pass (`pageRanges: '1'`, zero margins, no footer)
 * and the body as a second pass (`pageRanges: '2-'`, real margins, footer template); the two are
 * then merged with pdfunite. Chromium keeps absolute page numbers under pageRanges, so body pages
 * still read "Page 2 of N". `@page :first { margin: 0 }` (honored by Chromium for page geometry)
 * lets the cover background bleed to the paper edge in both passes.
 *
 * The cover is built from the guide itself: the h1 becomes the title and the h1's first paragraph
 * becomes the description under the fixed subtitle; both are dropped from the body flow (along
 * with the rule that separated them) so the body starts at the table of contents. The cover's
 * "Version X · Month Y" line takes the version from package.json and the month/year from the date
 * in CHANGELOG.md's top release heading — never the build clock — so builds are reproducible.
 *
 * Self-checks (fail the build): every `#anchor` TOC target must resolve to a generated heading id,
 * the four `### Example` headings must exist, the CDN URL must appear, no raw Markdown artifacts
 * may survive in the rendered text, both cover logo files must exist, be referenced by resolved
 * file path, and actually load in the page, and the cover's version + month/year line must match
 * package.json and the CHANGELOG-derived value.
 */
import { chromium } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { pathToFileURL } from 'node:url'

const SRC = 'CLIENT_GUIDE.md'
const CHANGELOG = 'CHANGELOG.md'
const OUT = 'docs/TNC-EN-Lightbox-Client-Guide.pdf'
const CDN_URL_NEEDLE = 'rackcdn.com/2246/en-lightbox.js'
const LOGO_TNC = 'docs/assets/logo-tnc.png'
const LOGO_4SITE = 'docs/assets/logo-4site.png'
const COVER_SUBTITLE = 'A campaign popup for your Engaging Networks pages.'

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

/**
 * Minimal syntax tint for `html`/`javascript`/`js` fences, run on the ESCAPED code so markup like
 * `<script>` stays literal. Double-quoted strings (`&quot;` after escaping) -> .tk-s, `//` line
 * comments -> .tk-c, identifiers immediately before `:` (object keys) -> .tk-k, everything else
 * keeps the base color. HTML tags are never tinted: their text contains no keys/strings/comments.
 * `text` and other fences are not tinted at all.
 */
function tintCode(lang: string, raw: string): string {
  const esc = escapeHtml(raw)
  if (!/^(html|javascript|js)$/.test(lang)) return esc
  const out: string[] = []
  let i = 0
  while (i < esc.length) {
    if (esc.startsWith('&quot;', i)) {
      let j = esc.indexOf('&quot;', i + 6)
      while (j !== -1 && esc[j - 1] === '\\') j = esc.indexOf('&quot;', j + 6)
      const end = j === -1 ? esc.length : j + 6
      out.push(`<span class="tk-s">${esc.slice(i, end)}</span>`)
      i = end
      continue
    }
    if (esc.startsWith('//', i)) {
      const nl = esc.indexOf('\n', i)
      const end = nl === -1 ? esc.length : nl
      out.push(`<span class="tk-c">${esc.slice(i, end)}</span>`)
      i = end
      continue
    }
    if (/[A-Za-z_$]/.test(esc[i])) {
      let j = i + 1
      while (j < esc.length && /[\w$]/.test(esc[j])) j++
      let k = j
      while (k < esc.length && (esc[k] === ' ' || esc[k] === '\t')) k++
      if (esc[k] === ':') {
        out.push(`<span class="tk-k">${esc.slice(i, j)}</span>${esc.slice(j, k)}:`)
        i = k + 1
        continue
      }
      out.push(esc.slice(i, j))
      i = j
      continue
    }
    out.push(esc[i])
    i++
  }
  return out.join('')
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

function renderMarkdown(md: string): { body: string; headings: Heading[] } {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  const headings: Heading[] = []
  const usedSlugs = new Map<string, number>()
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
        `<pre><code${lang ? ` class="language-${lang}"` : ''}>${tintCode(lang, buf.join('\n'))}</code></pre>`,
      )
      continue
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      const level = h[1].length
      const raw = h[2].trim()
      const id = githubSlug(raw, usedSlugs)
      headings.push({ level, text: raw, id })
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
  return { body: out.join('\n'), headings }
}

/**
 * Pulls the cover material out of the Markdown: the h1 (title) and the first paragraph after it
 * (description). Returns the remaining Markdown with the h1, that paragraph, and the rule(s) that
 * separated them from the content removed, so the rendered body starts at the table of contents.
 */
function extractCover(md: string): { title: string; description: string; bodyMd: string } {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  let i = 0
  while (i < lines.length && lines[i].trim() === '') i++
  const h1 = i < lines.length ? lines[i].match(/^#\s+(.*)$/) : null
  if (!h1) throw new Error(`${SRC} must start with an h1 — it becomes the cover title`)
  const title = h1[1].trim()
  i++
  while (i < lines.length && lines[i].trim() === '') i++
  const para: string[] = []
  while (i < lines.length && lines[i].trim() !== '') {
    para.push(lines[i].trim())
    i++
  }
  if (para.length === 0) {
    throw new Error(`no paragraph after the h1 in ${SRC} — it becomes the cover description`)
  }
  while (i < lines.length && (lines[i].trim() === '' || /^-{3,}\s*$/.test(lines[i]))) i++
  return { title, description: para.join(' '), bodyMd: lines.slice(i).join('\n') }
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** "Month YYYY" from the date in CHANGELOG.md's top release heading, e.g. `(2026-08-19)`. */
function changelogMonthYear(changelog: string): string {
  const m = changelog.match(/^## \[[^\]]+\]\([^)]*\) \((\d{4})-(\d{2})-(\d{2})\)/m)
  if (!m) throw new Error(`no dated release heading (## [x.y.z](…) (YYYY-MM-DD)) found in ${CHANGELOG}`)
  const month = MONTHS[Number(m[2]) - 1]
  if (!month) throw new Error(`unparseable month in CHANGELOG release date '${m[0]}'`)
  return `${month} ${m[1]}`
}

const CSS = `
  @page :first { margin: 0; }
  html { -webkit-print-color-adjust: exact; }
  body {
    font-family: Helvetica, "Helvetica Neue", Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.55;
    color: #2c3a33;
    margin: 0;
  }
  /* ---- Cover (page 1; @page :first removes the margins so the background bleeds) ---- */
  .cover {
    box-sizing: border-box;
    width: 215.9mm;
    height: 279.4mm;
    padding: 26mm 18mm 20mm;
    background: #fcfbf7;
    display: flex;
    flex-direction: column;
    page-break-after: always;
  }
  .logo-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28pt;
  }
  .logo-tnc { height: 78px; }
  .logo-4site { height: 92px; }
  .cover-rule { border-top: 1px solid #e5e7eb; }
  .cover-lede { margin-top: 40pt; }
  .eyebrow {
    color: #9ca3af;
    font-size: 10pt;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    margin: 0;
  }
  .cover-title {
    color: #2f6e2a;
    font-size: 54pt;
    font-weight: bold;
    line-height: 1.04;
    margin: 18pt 0 0;
  }
  .cover-subtitle { color: #2c3a33; font-size: 18pt; margin: 22pt 0 0; }
  .cover-desc {
    color: #767c83;
    font-size: 13pt;
    line-height: 1.55;
    margin: 16pt 0 0;
    max-width: 118mm;
  }
  .cover-foot { margin-top: auto; }
  .cf-guide {
    color: #111827;
    font-size: 10pt;
    font-weight: bold;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin: 16pt 0 0;
  }
  .cf-prepared { color: #4b5563; font-size: 12pt; margin: 9pt 0 0; }
  .cf-version { color: #9ca3af; font-size: 11pt; margin: 7pt 0 0; }
  /* ---- Body ---- */
  h2 {
    font-size: 24pt;
    font-weight: bold;
    color: #003d24;
    margin: 0 0 14pt;
    padding-bottom: 6pt;
    border-bottom: 3px solid #006537;
    page-break-before: always;
    page-break-after: avoid;
  }
  h3 { font-size: 15pt; font-weight: bold; color: #247b53; margin: 16pt 0 6pt; }
  h4 { font-size: 12.5pt; font-weight: bold; color: #2c3a33; margin: 12pt 0 4pt; }
  h3, h4 { page-break-after: avoid; }
  p { margin: 0 0 10pt; }
  a { color: #006537; text-decoration: none; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 14pt 0; }
  code {
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
    font-size: 90%;
    background: #eef2ef;
    color: #2c3a33;
    padding: 1px 6px;
    border-radius: 4px;
  }
  pre {
    background: #0e1f17;
    border-radius: 8px;
    padding: 16px 18px;
    margin: 0 0 12pt;
    page-break-inside: avoid;
  }
  pre code {
    background: transparent;
    padding: 0;
    border-radius: 0;
    font-size: 9.5pt;
    line-height: 1.5;
    color: #d9efe3;
    white-space: pre-wrap;
    word-break: break-all;
  }
  pre code .tk-k { color: #8dbbdc; }
  pre code .tk-s { color: #ffd9a0; }
  pre code .tk-c { color: #5b7d6b; }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 0 0 12pt;
    font-size: 10.5pt;
    page-break-inside: avoid;
  }
  th {
    background: #003d24;
    color: #fff;
    font-weight: bold;
    padding: 10px 14px;
    text-align: left;
    vertical-align: top;
  }
  td {
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
    padding: 10px 14px;
    text-align: left;
    vertical-align: top;
  }
  ul, ol { margin: 0 0 10pt; padding-left: 20pt; }
  li { margin-bottom: 6px; }
  li::marker { color: #2c3a33; }
  blockquote {
    margin: 0 0 10pt;
    background: #f2f5f3;
    border-left: 3px solid #006537;
    border-radius: 6px;
    padding: 14px 18px;
    page-break-inside: avoid;
  }
  blockquote p { margin: 0; }
`

async function main(): Promise<void> {
  const md = fs.readFileSync(SRC, 'utf8')
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { version: string }
  const monthYear = changelogMonthYear(fs.readFileSync(CHANGELOG, 'utf8'))
  const { title, description, bodyMd } = extractCover(md)
  const { body, headings } = renderMarkdown(bodyMd)

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

  // --- Cover page ---
  const logoTncPath = path.resolve(LOGO_TNC)
  const logo4sitePath = path.resolve(LOGO_4SITE)
  const logoTncUrl = pathToFileURL(logoTncPath).toString()
  const logo4siteUrl = pathToFileURL(logo4sitePath).toString()
  const versionLine = `Version ${pkg.version} · ${monthYear}`
  const cover = `<div class="cover">
  <div class="cover-head">
    <div class="logo-row">
      <img class="logo-tnc" src="${logoTncUrl}" alt="The Nature Conservancy">
      <img class="logo-4site" src="${logo4siteUrl}" alt="4Site Studios">
    </div>
    <div class="cover-rule"></div>
  </div>
  <div class="cover-lede">
    <p class="eyebrow">The Nature Conservancy</p>
    <h1 class="cover-title">${renderInline(title)}</h1>
    <p class="cover-subtitle">${COVER_SUBTITLE}</p>
    <p class="cover-desc">${renderInline(description)}</p>
  </div>
  <div class="cover-foot">
    <div class="cover-rule"></div>
    <p class="cf-guide">Campaign Guide</p>
    <p class="cf-prepared">Prepared by 4Site Studios for The Nature Conservancy</p>
    <p class="cf-version">${versionLine}</p>
  </div>
</div>`

  for (const [name, logoPath, logoUrl] of [
    ['logo-tnc', logoTncPath, logoTncUrl],
    ['logo-4site', logo4sitePath, logo4siteUrl],
  ] as const) {
    if (!fs.existsSync(logoPath)) {
      throw new Error(`cover ${name} missing at ${logoPath} — run the logo extraction first`)
    }
    if (!cover.includes(`src="${logoUrl}"`)) {
      throw new Error(`cover does not reference ${name} by its resolved file path ${logoUrl}`)
    }
  }

  const doc = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)} — TNC EN Lightbox Client Guide</title>
<style>${CSS}</style>
</head>
<body>
${cover}
${body}
</body>
</html>`

  if (!doc.includes(versionLine)) {
    throw new Error(`cover version line '${versionLine}' missing from the document`)
  }

  // The logos are referenced by file path, so the page must itself be a file: document —
  // Chromium refuses file: subresources on an about:blank (setContent) page.
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'client-guide-pdf-'))
  try {
    const htmlPath = path.join(tmpDir, 'guide.html')
    const coverPdf = path.join(tmpDir, 'cover.pdf')
    const bodyPdf = path.join(tmpDir, 'body.pdf')
    fs.writeFileSync(htmlPath, doc)

    const browser = await chromium.launch()
    try {
      const page = await browser.newPage()
      await page.goto(pathToFileURL(htmlPath).toString(), { waitUntil: 'load' })

      // --- Self-checks on the rendered page ---
      const logoStatus = await page.evaluate(() => {
        const imgs = Array.from(document.images)
        return {
          count: imgs.length,
          allLoaded: imgs.every((img) => img.complete && img.naturalWidth > 0),
        }
      })
      if (logoStatus.count !== 2 || !logoStatus.allLoaded) {
        throw new Error('cover logos did not load in the rendered page')
      }
      const renderedText = await page.evaluate(() => document.body.innerText)
      for (const artifact of ['**', '```', '|---|']) {
        if (renderedText.includes(artifact)) {
          throw new Error(`raw Markdown artifact survived in rendered text: '${artifact}'`)
        }
      }

      const footer = `<div style="font-family:Helvetica,'Helvetica Neue',Arial,sans-serif; font-size:8.5pt; color:#9ca3af; width:100%; padding:0 18mm; display:flex; justify-content:space-between;">
  <span>TNC EN Lightbox — Client Guide · v${pkg.version}</span>
  <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
</div>`

      // Pass 1: the cover alone — zero margins, no Chromium header/footer.
      await page.pdf({
        path: coverPdf,
        format: 'Letter',
        printBackground: true,
        margin: { top: '0', bottom: '0', left: '0', right: '0' },
        pageRanges: '1',
      })
      // Pass 2: the body — real margins and the footer. Chromium keeps absolute page
      // numbers under pageRanges, so these read "Page 2 of N" … "Page N of N".
      await page.pdf({
        path: bodyPdf,
        format: 'Letter',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: footer,
        margin: { top: '20mm', bottom: '22mm', left: '18mm', right: '18mm' },
        pageRanges: '2-',
      })
    } finally {
      await browser.close()
    }

    fs.mkdirSync('docs', { recursive: true })
    try {
      execFileSync('pdfunite', [coverPdf, bodyPdf, OUT], { stdio: 'inherit' })
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      throw new Error(`pdfunite (poppler) is required to merge the cover/body passes — ${detail}`, {
        cause: err,
      })
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  const bytes = fs.statSync(OUT).size
  const info = execFileSync('pdfinfo', [OUT]).toString('utf8')
  const pageCount = Number(info.match(/^Pages:\s*(\d+)/m)?.[1])
  console.log(`wrote ${OUT} (${bytes} bytes, ${pageCount} pages)`)
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
