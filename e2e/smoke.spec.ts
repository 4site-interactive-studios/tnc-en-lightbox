import { test, expect, type Page } from '@playwright/test'
import { harnessUrl } from './helpers'

const baseConfig = {
  header: 'Smoke header',
  body: 'Smoke body',
  image: {
    src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    alt: '',
  },
  cta: { label: 'Smoke CTA', href: '#' },
}

test('lightbox opens on time trigger', async ({ page }) => {
  await page.goto(harnessUrl({ ...baseConfig, triggers: { time: 50 } }))
  const overlay = page.locator('.enlb-overlay')
  await expect(overlay).toBeVisible()
})

test('renders overlay, dialog, two-column layout and close button', async ({ page }, testInfo) => {
  await page.goto(harnessUrl({ ...baseConfig, triggers: { time: 50 } }))
  const overlay = page.locator('.enlb-overlay')
  const dialog = page.locator('.enlb-dialog')
  const layout = page.locator('.enlb-layout')
  const image = layout.locator('.enlb-image')
  await expect(overlay).toBeVisible()
  await expect(dialog).toHaveAttribute('role', 'dialog')
  await expect(dialog).toHaveAttribute('aria-modal', 'true')
  await expect(layout.locator('.enlb-content')).toBeVisible()
  await expect(page.locator('.enlb-close')).toBeVisible()
  if (testInfo.project.name === 'Mobile Chrome') {
    await expect(image).toBeHidden()
  } else {
    await expect(image).toBeVisible()
  }
})

test('closes via Escape key', async ({ page }) => {
  await page.goto(harnessUrl({ ...baseConfig, triggers: { time: 50 } }))
  const overlay = page.locator('.enlb-overlay')
  await expect(overlay).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(overlay).toHaveCount(0)
})

test('closes via close button', async ({ page }) => {
  await page.goto(harnessUrl({ ...baseConfig, triggers: { time: 50 } }))
  const overlay = page.locator('.enlb-overlay')
  await expect(overlay).toBeVisible()
  await page.locator('.enlb-close').click()
  await expect(overlay).toHaveCount(0)
})

test('closes via overlay click', async ({ page }) => {
  await page.goto(harnessUrl({ ...baseConfig, triggers: { time: 50 } }))
  const overlay = page.locator('.enlb-overlay')
  await expect(overlay).toBeVisible()
  await overlay.click({ position: { x: 5, y: 5 } })
  await expect(overlay).toHaveCount(0)
})

test('focus moves inside dialog when opened', async ({ page }) => {
  await page.goto(harnessUrl({ ...baseConfig, triggers: { time: 50 } }))
  await expect(page.locator('.enlb-dialog')).toBeFocused()
})

test('frequency dismissal suppresses re-open within window', async ({ page }) => {
  const url = harnessUrl({ ...baseConfig, triggers: { time: 50 } })
  await page.goto(url)
  const overlay = page.locator('.enlb-overlay')
  await expect(overlay).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(overlay).toHaveCount(0)
  await page.goto(url)
  await expect(overlay).toBeHidden({ timeout: 500 })
})

test('exit-intent trigger opens in desktop browsers', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'Mobile Chrome', 'exit-intent is desktop-only')
  await page.goto(harnessUrl({ ...baseConfig, triggers: { exitIntent: true } }))
  await page.evaluate(() => {
    document.dispatchEvent(new MouseEvent('mouseout', { clientY: -5, relatedTarget: null }))
  })
  await expect(page.locator('.enlb-overlay')).toBeVisible()
})

test('primary CTA is an anchor and navigates', async ({ page }) => {
  await page.goto(harnessUrl({ ...baseConfig, triggers: { time: 50 }, cta: { label: 'Smoke CTA', href: '#cta-navigated' } }))
  const cta = page.locator('.enlb-cta')
  await expect(cta).toHaveAttribute('href', '#cta-navigated')
  await cta.click()
  await expect(page).toHaveURL(/#cta-navigated$/)
})

test('imagePosition right renders image on the right', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'Mobile Chrome', 'desktop layout only')
  await page.goto(
    harnessUrl({ ...baseConfig, triggers: { time: 50 }, layout: { imagePosition: 'right' } }),
  )
  const image = page.locator('.enlb-image')
  const content = page.locator('.enlb-content')
  await expect(image).toBeVisible()
  await expect(content).toBeVisible()
  const imageBox = await image.boundingBox()
  const contentBox = await content.boundingBox()
  expect(imageBox).not.toBeNull()
  expect(contentBox).not.toBeNull()
  expect(imageBox!.x).toBeGreaterThan(contentBox!.x)
})

test('imagePosition left renders image on the left', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'Mobile Chrome', 'desktop layout only')
  await page.goto(
    harnessUrl({ ...baseConfig, triggers: { time: 50 }, layout: { imagePosition: 'left' } }),
  )
  const image = page.locator('.enlb-image')
  const content = page.locator('.enlb-content')
  await expect(image).toBeVisible()
  await expect(content).toBeVisible()
  const imageBox = await image.boundingBox()
  const contentBox = await content.boundingBox()
  expect(imageBox).not.toBeNull()
  expect(contentBox).not.toBeNull()
  expect(imageBox!.x).toBeLessThan(contentBox!.x)
})

test('scroll-depth trigger opens after scrolling', async ({ page }) => {
  await page.goto(harnessUrl({ ...baseConfig, triggers: { scroll: 50 } }))
  await page.evaluate(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo(0, maxScroll * 0.5)
  })
  await expect(page.locator('.enlb-overlay')).toBeVisible()
})

test('dark theme applies dark surface color to dialog', async ({ page }) => {
  await page.goto(
    harnessUrl({ ...baseConfig, triggers: { time: 50 }, theme: { preset: 'dark' } }),
  )
  const overlay = page.locator('.enlb-overlay')
  await expect(overlay).toHaveClass(/enlb-theme-dark/)
  const dialog = page.locator('.enlb-dialog')
  const bg = await dialog.evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(bg).toBe('rgb(31, 31, 31)')
})

test('per-token color override beats preset in computed style', async ({ page }) => {
  await page.goto(
    harnessUrl({
      ...baseConfig,
      triggers: { time: 50 },
      theme: { preset: 'dark', colors: { ctaBg: '#ff0000' } },
    }),
  )
  const cta = page.locator('.enlb-cta')
  const bg = await cta.evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(bg).toBe('rgb(255, 0, 0)')
})

test('brand theme applies brand surface color to dialog', async ({ page }) => {
  await page.goto(
    harnessUrl({ ...baseConfig, triggers: { time: 50 }, theme: { preset: 'brand' } }),
  )
  const overlay = page.locator('.enlb-overlay')
  await expect(overlay).toHaveClass(/enlb-theme-brand/)
  const dialog = page.locator('.enlb-dialog')
  const bg = await dialog.evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(bg).toBe('rgb(0, 61, 36)')
})

const enFormConfig = {
  ...baseConfig,
  triggers: { time: 50 },
  cta: { label: 'Close', action: 'close' },
}

async function assertFormIsolated(page: Page): Promise<void> {
  const form = page.locator('#en-form')
  await expect(form).toHaveAttribute('inert', '')
  await expect(form).toHaveAttribute('aria-hidden', 'true')
  await expect(form).toHaveAttribute('tabindex', '-1')
}

async function assertFormSubmitsAndValidates(page: Page): Promise<void> {
  const form = page.locator('#en-form')
  const email = form.locator('input[name="email"]')
  const name = form.locator('input[name="name"]')

  await email.fill('')
  await name.fill('')
  const invalid = await form.evaluate((el) => (el as HTMLFormElement).checkValidity())
  expect(invalid).toBe(false)

  await email.fill('test@example.com')
  await name.fill('Test')
  const valid = await form.evaluate((el) => (el as HTMLFormElement).checkValidity())
  expect(valid).toBe(true)

  await email.focus()
  await expect(email).toBeFocused()

  const submitFired = await form.evaluate((el) => {
    let fired = false
    let defaultPrevented = true
    const handler = (e: Event) => {
      fired = true
      defaultPrevented = e.defaultPrevented
    }
    el.addEventListener('submit', handler, { once: true })
    el.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }))
    return { fired, defaultPrevented }
  })
  expect(submitFired.fired).toBe(true)
  expect(submitFired.defaultPrevented).toBe(false)
}

test('EN form is isolated while lightbox is open', async ({ page }) => {
  await page.goto(harnessUrl(enFormConfig))
  await expect(page.locator('.enlb-overlay')).toBeVisible()
  await assertFormIsolated(page)
})

test('EN form submits and validates after close via X button', async ({ page }) => {
  await page.goto(harnessUrl(enFormConfig))
  await expect(page.locator('.enlb-overlay')).toBeVisible()
  await page.locator('.enlb-close').click()
  await expect(page.locator('.enlb-overlay')).toHaveCount(0)
  await assertFormSubmitsAndValidates(page)
})

test('EN form submits and validates after close via close CTA', async ({ page }) => {
  await page.goto(harnessUrl(enFormConfig))
  await expect(page.locator('.enlb-overlay')).toBeVisible()
  await page.locator('.enlb-cta').click()
  await expect(page.locator('.enlb-overlay')).toHaveCount(0)
  await assertFormSubmitsAndValidates(page)
})

test('EN form submits and validates after redirect CTA', async ({ page }) => {
  await page.goto(
    harnessUrl({
      ...baseConfig,
      triggers: { time: 50 },
      cta: { label: 'Go', href: '#en-form', action: 'redirect' },
    }),
  )
  await expect(page.locator('.enlb-overlay')).toBeVisible()
  await assertFormIsolated(page)
  await page.locator('.enlb-cta').click()
  await expect(page.locator('.enlb-overlay')).toBeVisible()
  await assertFormIsolated(page)
  await page.locator('.enlb-close').click()
  await expect(page.locator('.enlb-overlay')).toHaveCount(0)
  await assertFormSubmitsAndValidates(page)
})

test('a malformed config degrades: valid trigger still opens, no page error, EN form isolated', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  await page.goto(
    harnessUrl({
      header: 'Malformed',
      body: 'B',
      cta: { label: 'Go', href: '#' },
      // triggers.list is non-iterable (dropped); triggers.time is valid (arms + opens)
      triggers: { list: 123, time: 50 },
    }),
  )
  expect(errors).toEqual([])
  // Degrade, not swallow: the valid time trigger still opens the default-themed lightbox
  const overlay = page.locator('.enlb-overlay')
  await expect(overlay).toBeVisible()
  await expect(overlay).toHaveClass(/enlb-theme-light/)
  // The host EN form is isolated while the lightbox is open (host page not disrupted)
  await expect(page.locator('#en-form')).toHaveAttribute('inert', '')
  // Close and verify the form is interactive again
  await page.locator('.enlb-close').click()
  await expect(overlay).toHaveCount(0)
  const form = page.locator('#en-form')
  await form.locator('input[name="email"]').fill('test@example.com')
  await expect(form.locator('input[name="email"]')).toHaveValue('test@example.com')
})

test('armTriggers with an unknown trigger type does not throw on the host page', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  await page.goto(harnessUrl({ header: 'H', body: 'B' }))
  await expect(page.locator('.enlb-overlay')).toHaveCount(0)
  await page.evaluate(() => {
    ;(window as unknown as { ENLightboxAPI: { armTriggers: (c: unknown) => void } }).ENLightboxAPI.armTriggers({ list: [{ type: 'bogus' }] })
  })
  expect(errors).toEqual([])
})

// ── Style isolation (Shadow DOM) ────────────────────────────────────────────
// A hostile host stylesheet must not reach the lightbox. The host page sets an
// inheritable serif font, a focus border, and content-box sizing; none of these
// may affect the shadow-rendered dialog. Red against the head-DOM rendering,
// green once the lightbox renders inside a Shadow DOM with a :host reset.
const hostileHostCss = [
  // Inheritable property — bleeds across the shadow boundary unless :host resets it.
  'html, body { font-family: Georgia, "Times New Roman", serif; }',
  // Selector rule that hit the old light-DOM <h2> title directly.
  'h2 { font-family: Georgia, serif !important; }',
  // The stray focus border seen on the first live render.
  ':focus { border: 4px solid red !important; outline: 4px solid red !important; }',
  // Global box model override.
  '* { box-sizing: content-box !important; }',
  // Inheritable properties only `all: initial` on :host can defend against.
  'body { letter-spacing: 8px; text-transform: uppercase; }',
  // Host width override — the dialog must keep its own 900px cap.
  '.enlb-dialog { width: 2000px !important; max-width: 2000px !important; }',
].join('\n')

test('lightbox is style-isolated from a hostile host stylesheet (font, border, box-sizing)', async ({ page }) => {
  await page.goto(
    harnessUrl({ ...baseConfig, header: 'Isolated heading', triggers: { time: 50 } }, hostileHostCss),
  )
  const dialog = page.locator('.enlb-dialog')
  const title = page.locator('.enlb-title')
  await expect(dialog).toBeVisible()
  await expect(title).toBeVisible()

  // The host's hostile CSS must actually be present on the page (guards the harness).
  await expect(page.locator('#hostile-host-css')).toHaveCount(1)

  // Font-family: the lightbox's own sans-serif stack, NOT the host's Georgia serif.
  const titleFont = await title.evaluate((el) => getComputedStyle(el).fontFamily)
  expect(titleFont).toContain('system-ui')
  expect(titleFont.toLowerCase()).not.toContain('georgia')

  // The focused dialog must not pick up the host's :focus border.
  const borderTopWidth = await dialog.evaluate((el) => getComputedStyle(el).borderTopWidth)
  expect(borderTopWidth).toBe('0px')

  // Box-sizing: the host's `* { box-sizing: content-box }` must not reach the shadow.
  const boxSizing = await dialog.evaluate((el) => getComputedStyle(el).boxSizing)
  expect(boxSizing).toBe('border-box')

  // Inheritable properties only `all: initial` on :host can defend against —
  // the host's letter-spacing and text-transform must not bleed into the shadow.
  const letterSpacing = await title.evaluate((el) => getComputedStyle(el).letterSpacing)
  expect(letterSpacing).toBe('normal')
  const textTransform = await title.evaluate((el) => getComputedStyle(el).textTransform)
  expect(textTransform).toBe('none')

  // The host's width/max-width override must not reach the dialog; it keeps its 900px cap.
  const dialogBox = await dialog.boundingBox()
  expect(dialogBox).not.toBeNull()
  expect(dialogBox!.width).toBeLessThanOrEqual(900)
})

test('existing .enlb-* locators still resolve through the open shadow root', async ({ page }) => {
  await page.goto(harnessUrl({ ...baseConfig, triggers: { time: 50 } }, hostileHostCss))
  await expect(page.locator('.enlb-overlay')).toBeVisible()
  await expect(page.locator('.enlb-dialog')).toHaveAttribute('role', 'dialog')
  await expect(page.locator('.enlb-content')).toBeVisible()
  await expect(page.locator('.enlb-close')).toBeVisible()
})

// ── Layout polish ───────────────────────────────────────────────────────────
// A tall (portrait) image must not drive the dialog height. The content should
// fill the dialog vertically — no large empty void — and the image should cover
// a bounded box. Red against the `.enlb-img { height: 100% }` rendering.
const portraitImage =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="1000"><rect width="120" height="1000" fill="#006341"/></svg>',
  )

test('portrait image does not inflate the dialog height (no empty void)', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'Mobile Chrome', 'image column is hidden on mobile by default')
  await page.goto(
    harnessUrl({
      ...baseConfig,
      header: 'Bounded layout',
      body: 'The dialog height should be driven by this content, not by the portrait image beside it.',
      image: { src: portraitImage, alt: '' },
      triggers: { time: 50 },
    }),
  )
  const dialog = page.locator('.enlb-dialog')
  const content = page.locator('.enlb-content')
  const image = page.locator('.enlb-image')
  await expect(dialog).toBeVisible()

  const dialogBox = await dialog.boundingBox()
  const contentBox = await content.boundingBox()
  const imageBox = await image.boundingBox()
  expect(dialogBox).not.toBeNull()
  expect(contentBox).not.toBeNull()
  expect(imageBox).not.toBeNull()

  // The dialog is sized by its content, not inflated/capped by the portrait image.
  // Buggy rendering pins the dialog to the viewport cap; the fix keeps it compact.
  expect(dialogBox!.height).toBeLessThan(page.viewportSize()!.height * 0.8)
  // The image covers a bounded box matching the dialog — it does not drive the height.
  expect(imageBox!.height).toBeLessThanOrEqual(dialogBox!.height + 1)
  // Content fills the dialog vertically — no large empty region beside/below it.
  expect(contentBox!.height).toBeGreaterThanOrEqual(dialogBox!.height * 0.9)
})

// ── Image-top flush (no white band above image with outside close) ────────────
// When closeButton is 'outside' and imagePosition is 'top', the image must sit
// flush at the dialog's top edge. Before the :has() override, the outside-close
// padding-top (40px) pushed the image down creating a white band. This test
// measures the bounding-box gap between the dialog and the image to catch it.
test('image-top flush: no white band above image with outside close button', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'Mobile Chrome', 'image column is hidden on mobile by default')
  await page.goto(
    harnessUrl({
      header: 'Flush test',
      body: 'The image top must be flush with the dialog top edge.',
      image: {
        src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        alt: '',
      },
      cta: { label: 'OK', action: 'close' },
      layout: { imagePosition: 'top', closeButton: 'outside' },
      triggers: { time: 50 },
    }),
  )
  const dialog = page.locator('.enlb-dialog')
  const image = page.locator('.enlb-image')
  await expect(dialog).toBeVisible()
  await expect(image).toBeVisible()

  const dialogBox = await dialog.boundingBox()
  const imageBox = await image.boundingBox()
  expect(dialogBox).not.toBeNull()
  expect(imageBox).not.toBeNull()

  // The image sits at the top of the scroll wrapper inside the dialog.
  // With the :has() fix, padding-top is 0 and the gap is ≈0px (sub-2px
  // tolerance for scroll-wrapper border-radius clipping).
  // Without the fix, the gap was ~40px.
  const gap = imageBox!.y - dialogBox!.y
  expect(gap).toBeLessThanOrEqual(2)
})

// ── Outside close button (not clipped by dialog overflow) ─────────────────────
// The outside close button sits above the dialog (top: -32px). The dialog's
// overflow must not clip it. Red when the dialog has overflow:auto; green once
// scroll moves to an inner wrapper and the dialog uses overflow:visible.
test('outside close button is visible and clickable (not clipped)', async ({ page }) => {
  await page.goto(
    harnessUrl({ ...baseConfig, triggers: { time: 50 }, layout: { closeButton: 'outside' } }),
  )
  const overlay = page.locator('.enlb-overlay')
  const closeBtn = page.locator('.enlb-close')
  await expect(overlay).toBeVisible()
  // The button must be visible (not clipped by the dialog's overflow).
  await expect(closeBtn).toBeVisible()
  // Clicking it must close the lightbox — fails if the button is clipped/unclickable.
  await closeBtn.click()
  await expect(overlay).toHaveCount(0)
})

// ── Accessible name for empty-header dialog ───────────────────────────────────
// When the header is empty, aria-label provides the name and aria-labelledby must
// NOT point at an empty title node (which would yield an empty accessible name).
test('empty-header dialog has a non-empty accessible name via aria-label', async ({ page }) => {
  await page.goto(
    harnessUrl({ ...baseConfig, header: '', triggers: { time: 50 } }),
  )
  const dialog = page.locator('.enlb-dialog')
  await expect(dialog).toBeVisible()
  // aria-label provides the accessible name...
  await expect(dialog).toHaveAttribute('aria-label', 'Dialog')
  // ...and aria-labelledby must NOT be set (it would point at an empty title).
  const labelledby = await dialog.getAttribute('aria-labelledby')
  expect(labelledby).toBeNull()
})

// ── Host --enlb-* custom-property overrides do not affect the theme ───────────
// Custom properties are inheritable and pierce the shadow boundary, but :host
// defines every consumed --enlb-* token with a default, so host overrides can't
// sneak in. This locks that invariant.
test('host --enlb-* custom-property overrides do not affect the lightbox theme', async ({ page }) => {
  const tokenHostCss = [
    ':root {',
    '  --enlb-overlay-bg: hotpink;',
    '  --enlb-surface-bg: hotpink;',
    '  --enlb-text: hotpink;',
    '  --enlb-cta-bg: hotpink;',
    '}',
  ].join('\n')
  await page.goto(harnessUrl({ ...baseConfig, triggers: { time: 50 } }, tokenHostCss))
  const dialog = page.locator('.enlb-dialog')
  const bg = await dialog.evaluate((el) => getComputedStyle(el).backgroundColor)
  // Light theme surface is #fff = rgb(255,255,255), NOT hotpink.
  expect(bg).toBe('rgb(255, 255, 255)')
})

// ── Accessible close button (>=44x44 tap target + contrasting backing) ─────────
// jsdom cannot apply the shadow-root stylesheet to computed style, so the size
// and backing are verified here against a real browser.
test('close button has a >=44x44 tap target with a non-transparent rounded backing', async ({ page }) => {
  await page.goto(harnessUrl({ ...baseConfig, triggers: { time: 50 } }))
  const close = page.locator('.enlb-close')
  await expect(close).toBeVisible()
  const box = await close.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.width).toBeGreaterThanOrEqual(44)
  expect(box!.height).toBeGreaterThanOrEqual(44)
  // A backing must be present so the x is visible over photographs and surfaces.
  const bg = await close.evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(bg).not.toBe('rgba(0, 0, 0, 0)')
  expect(bg).not.toBe('transparent')
  // Rounded backing (circle).
  const radius = await close.evaluate((el) => getComputedStyle(el).borderRadius)
  expect(radius).not.toBe('0px')
})

// ── Wave-5 design refresh: eyebrow + forest/sky presets ───────────────────────
test('forest theme applies the forest surface color and renders an eyebrow above the title', async ({ page }) => {
  await page.goto(
    harnessUrl({
      ...baseConfig,
      header: 'Stay with us',
      eyebrow: 'Last Chance',
      triggers: { time: 50 },
      theme: { preset: 'forest' },
    }),
  )
  const overlay = page.locator('.enlb-overlay')
  await expect(overlay).toHaveClass(/enlb-theme-forest/)
  const dialog = page.locator('.enlb-dialog')
  const bg = await dialog.evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(bg).toBe('rgb(13, 107, 78)') // #0d6b4e

  // The eyebrow renders above the title.
  const eyebrow = page.locator('.enlb-eyebrow')
  await expect(eyebrow).toBeVisible()
  await expect(eyebrow).toHaveText('Last Chance')
  const title = page.locator('.enlb-title')
  const eyebrowBox = await eyebrow.boundingBox()
  const titleBox = await title.boundingBox()
  expect(eyebrowBox).not.toBeNull()
  expect(titleBox).not.toBeNull()
  expect(eyebrowBox!.y).toBeLessThan(titleBox!.y)

  // The forest close button has a white backing (white box / green x) so the x
  // is visible over the green surface and over a photograph.
  const close = page.locator('.enlb-close')
  const closeBg = await close.evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(closeBg).toBe('rgb(255, 255, 255)') // #fff
})

test('sky theme applies the sky surface color to the dialog', async ({ page }) => {
  await page.goto(
    harnessUrl({ ...baseConfig, triggers: { time: 50 }, theme: { preset: 'sky' } }),
  )
  const overlay = page.locator('.enlb-overlay')
  await expect(overlay).toHaveClass(/enlb-theme-sky/)
  const dialog = page.locator('.enlb-dialog')
  const bg = await dialog.evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(bg).toBe('rgb(167, 204, 227)') // #a7cce3

  // The sky close button has a dark backing (dark box / white x), visible over
  // the light-blue surface.
  const close = page.locator('.enlb-close')
  const closeBg = await close.evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(closeBg).toBe('rgb(22, 24, 29)') // #16181d
})

