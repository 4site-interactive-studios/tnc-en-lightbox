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

test('renders overlay, dialog, two-column layout and close button', async ({ page }) => {
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
  // hideImageOnMobile defaults to false (show on mobile), so the image column is
  // visible on every project — including the Mobile Chrome (Pixel 5) viewport.
  await expect(image).toBeVisible()
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

// ── hideImageOnMobile default (show on mobile; set true to hide) ──────────────
// The default is false: the image is VISIBLE on a mobile viewport unless
// hideImageOnMobile is explicitly set to true. Asserts the RENDERED display
// (not the class) on a 375px viewport (under the 700px stack breakpoint). jsdom
// can't read shadow computed style (LEARNINGS.md), so this is e2e-only.
test.describe('hideImageOnMobile default — image visible on mobile unless explicitly hidden', () => {
  test('image is visible on a mobile viewport when hideImageOnMobile is unset (default)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto(harnessUrl({ ...baseConfig, triggers: { time: 50 } }))
    const image = page.locator('.enlb-image')
    await expect(image).toBeVisible()
    const display = await image.evaluate((el) => getComputedStyle(el).display)
    expect(display).not.toBe('none')
  })

  test('image is hidden (display:none) on a mobile viewport when hideImageOnMobile is true', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto(
      harnessUrl({ ...baseConfig, triggers: { time: 50 }, hideImageOnMobile: true }),
    )
    const image = page.locator('.enlb-image')
    await expect(image).toBeHidden()
    const display = await image.evaluate((el) => getComputedStyle(el).display)
    expect(display).toBe('none')
  })
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

// ── CTA hover effect (issue #49) ─────────────────────────────────────────────
// A tasteful, theme-agnostic hover (transform: scale, not a color change so it
// works for forest's white CTA, sky's black CTA, light's blue CTA, etc.). It must
// not cause layout shift (transform, not width/padding). Hover + focus-visible
// for keyboard parity; prefers-reduced-motion suppresses it.
test('primary CTA scales up on hover with no layout shift', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'Mobile Chrome', 'hover transform is a desktop interaction')
  await page.goto(
    harnessUrl({ ...baseConfig, triggers: { time: 50 }, cta: { label: 'Give monthly', href: '#give' } }),
  )
  const cta = page.locator('.enlb-cta:not(.enlb-cta--secondary)')
  await expect(cta).toBeVisible()

  // No transform at rest.
  const restTransform = await cta.evaluate((el) => getComputedStyle(el).transform)
  expect(restTransform).toBe('none')
  // Capture the LAYOUT size (offsetWidth/Height are transform-invariant, unlike
  // boundingBox which includes the paint transform) to prove hover causes no
  // layout shift — the effect is transform-only, not width/padding.
  const restSize = await cta.evaluate((el) => ({ w: (el as HTMLElement).offsetWidth, h: (el as HTMLElement).offsetHeight }))

  await cta.hover()
  await page.waitForTimeout(220)
  // Hover scales the CTA up (>1) via transform.
  const hoverA = await cta.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a)
  expect(hoverA).toBeGreaterThan(1)
  // Transform doesn't trigger layout: offset size is unchanged.
  const hoverSize = await cta.evaluate((el) => ({ w: (el as HTMLElement).offsetWidth, h: (el as HTMLElement).offsetHeight }))
  expect(hoverSize.w).toBe(restSize.w)
  expect(hoverSize.h).toBe(restSize.h)
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
  test.skip(testInfo.project.name === 'Mobile Chrome', 'desktop campaign layout (mobile stacks)')

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
  test.skip(testInfo.project.name === 'Mobile Chrome', 'desktop campaign layout (mobile stacks)')

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

// ── imagePosition:"top" stacks vertically (not a second column) ──────────────
// buildLayoutClasses adds BOTH enlb-layout--two-column AND enlb-layout--image-top,
// so the generic 50/50 grid (display:grid) would force two columns and ignore
// image-top. The image-top rule must override the grid back to a single stacked
// column (image above content). Asserts the RENDERED position, not class presence.
test('imagePosition top stacks the image above the content (not side-by-side)', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'Mobile Chrome', 'desktop two-column layout')
  await page.goto(
    harnessUrl({
      ...baseConfig,
      header: 'Stacked layout',
      body: 'The image must sit above the content, not beside it.',
      cta: { label: 'OK', action: 'close' },
      layout: { imagePosition: 'top' },
      triggers: { time: 50 },
    }),
  )
  const layout = page.locator('.enlb-layout')
  const image = page.locator('.enlb-image')
  const content = page.locator('.enlb-content')
  await expect(image).toBeVisible()
  await expect(content).toBeVisible()

  // The layout is a single stacked column (flex), NOT the 50/50 grid.
  const layoutDisplay = await layout.evaluate((el) => getComputedStyle(el).display)
  expect(layoutDisplay).toBe('flex')

  const imageBox = await image.boundingBox()
  const contentBox = await content.boundingBox()
  expect(imageBox).not.toBeNull()
  expect(contentBox).not.toBeNull()
  // Image sits ABOVE the content (stacked), and they share the same x (full width).
  expect(imageBox!.y).toBeLessThan(contentBox!.y)
  expect(Math.abs(imageBox!.x - contentBox!.x)).toBeLessThanOrEqual(2)
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

// ── Outside close leaves no padding band at the top (issue #49) ───────────────
// The outside close sits at top:-32px (above the dialog), so the dialog needs NO
// top padding to accommodate it. The old padding-top: calc(24px + spacing-md) =
// 40px painted a colored band above the content. With a two-column (image)
// inside-close... here outside-close two-column: the layout must start at the
// dialog's top edge (gap ≈ 0), not 40px down.
test('outside close button leaves no padding band above the content', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'Mobile Chrome', 'desktop two-column layout')
  await page.goto(
    harnessUrl({ ...baseConfig, triggers: { time: 50 }, layout: { closeButton: 'outside' } }),
  )
  const dialog = page.locator('.enlb-dialog')
  const scroll = page.locator('.enlb-scroll')
  await expect(dialog).toBeVisible()

  const dialogBox = await dialog.boundingBox()
  const scrollBox = await scroll.boundingBox()
  expect(dialogBox).not.toBeNull()
  expect(scrollBox).not.toBeNull()
  // The scroll wrapper (which holds the layout) starts at the dialog's top edge —
  // no 40px padding band. Tolerance 2px for border-radius clipping.
  const gap = scrollBox!.y - dialogBox!.y
  expect(gap).toBeLessThanOrEqual(2)
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

// ── Close × drawn with CSS pseudo-elements + hover scale (issue #49) ──────────
// The visible × is drawn by ::before/::after (two diagonal lines) for pixel
// consistency across browsers/fonts (the text × shifted vertically per font).
// aria-label="Close" still provides the accessible name; the text glyph is
// hidden (font-size:0). The line color follows --enlb-close-color per theme,
// and hover/focus-visible scale the button up (~1.08) with a transition that
// prefers-reduced-motion suppresses.
test('close × is drawn with ::before/::after pseudo-elements in the theme color and scales on hover', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'Mobile Chrome', 'hover transform is a desktop interaction')
  await page.goto(
    harnessUrl({ ...baseConfig, triggers: { time: 50 }, theme: { preset: 'forest' } }),
  )
  const close = page.locator('.enlb-close')
  await expect(close).toBeVisible()

  // The × is drawn by ::before (a line), not a text glyph. Before the fix the
  // pseudo-element is not generated (content: none) and has no background.
  const before = await close.evaluate((el) => {
    const cs = getComputedStyle(el, '::before')
    return { content: cs.content, width: cs.width, background: cs.backgroundColor }
  })
  expect(before.content).not.toBe('none')
  expect(before.width).not.toBe('auto')
  expect(before.width).not.toBe('0px')
  // Forest × is white (var(--enlb-close-color) #ffffff) on the green square.
  expect(before.background).toBe('rgb(255, 255, 255)')

  // No transform at rest; hover scales the button up (>1).
  const restTransform = await close.evaluate((el) => getComputedStyle(el).transform)
  expect(restTransform).toBe('none')
  await close.hover()
  await page.waitForTimeout(220)
  const hoverA = await close.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a)
  expect(hoverA).toBeGreaterThan(1)
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
  expect(bg).toBe('rgb(0, 101, 55)') // #006537 (corrected from #0d6b4e)

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

  // The eyebrow follows the forest title color (white), NOT the :host default
  // --enlb-title (#1f1f1f) that the var(--enlb-title) chain on :host would lock
  // in before the theme class's title takes effect.
  const eyebrowColor = await eyebrow.evaluate((el) => getComputedStyle(el).color)
  expect(eyebrowColor).toBe('rgb(255, 255, 255)')

  // The forest close button is a GREEN square (#006537) with a white ×, sitting
  // over the image area (no rounded backing). Corrected from the white box.
  const close = page.locator('.enlb-close')
  const closeBg = await close.evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(closeBg).toBe('rgb(0, 101, 55)') // #006537
  const closeColor = await close.evaluate((el) => getComputedStyle(el).color)
  expect(closeColor).toBe('rgb(255, 255, 255)') // white ×
  const closeRadius = await close.evaluate((el) => getComputedStyle(el).borderRadius)
  expect(closeRadius).toBe('0px') // square, not rounded
})

test('sky theme applies the sky surface color to the dialog', async ({ page }) => {
  await page.goto(
    harnessUrl({
      ...baseConfig,
      eyebrow: 'Matching gift',
      triggers: { time: 50 },
      theme: { preset: 'sky' },
    }),
  )
  const overlay = page.locator('.enlb-overlay')
  await expect(overlay).toHaveClass(/enlb-theme-sky/)
  const dialog = page.locator('.enlb-dialog')
  const bg = await dialog.evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(bg).toBe('rgb(141, 187, 220)') // #8DBBDC (corrected from #a7cce3)

  // The eyebrow follows the sky title color (#191919), NOT the :host default
  // --enlb-title (#1f1f1f) the var() chain would lock in.
  const eyebrow = page.locator('.enlb-eyebrow')
  await expect(eyebrow).toBeVisible()
  const eyebrowColor = await eyebrow.evaluate((el) => getComputedStyle(el).color)
  expect(eyebrowColor).toBe('rgb(25, 25, 25)')

  // The sky close button has NO box (transparent) — just a black × over the
  // light-blue surface. Corrected from the dark rounded box.
  const close = page.locator('.enlb-close')
  const closeBg = await close.evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(closeBg).toBe('rgba(0, 0, 0, 0)') // transparent — no box
  const closeColor = await close.evaluate((el) => getComputedStyle(el).color)
  expect(closeColor).toBe('rgb(0, 0, 0)') // black ×
  const closeRadius = await close.evaluate((el) => getComputedStyle(el).borderRadius)
  expect(closeRadius).toBe('0px')
})

// ── Wave-5 forest/sky mockup CORRECTION (issue #47): campaign geometry ─────────
// jsdom cannot read shadow computed style, so the 50/50 grid, modal sizing,
// typography, CTA dimensions, per-theme close geometry, and RENDERED column order
// (not DOM order) are all asserted here against a real browser. These run on the
// desktop projects only — the Mobile Chrome project is skipped (image hidden +
// stacked layout).
const forestCampaign = {
  ...baseConfig,
  eyebrow: 'Last chance',
  header: 'Protect what remains of our wild places',
  body: 'Your monthly gift defends forests, rivers, and wildlife all year long.',
  cta: { label: 'Give monthly', href: '#give' },
  secondaryCta: { label: 'Maybe later', href: '#later' },
  triggers: { time: 50 },
  theme: { preset: 'forest' },
  // Column order now follows imagePosition (themes are color-only). 'right' →
  // content first (LEFT) / image second (RIGHT), matching the forest mockup.
  layout: { imagePosition: 'right' },
}

const skyCampaign = {
  ...baseConfig,
  eyebrow: 'Matching gift',
  header: 'Double your impact today',
  body: 'Every dollar donated today is matched through midnight. Do not miss it.',
  cta: { label: 'Donate now', href: '#donate' },
  secondaryCta: { label: 'Learn more', href: '#more' },
  triggers: { time: 50 },
  theme: { preset: 'sky' },
  // Column order follows imagePosition. 'left' → image first (LEFT) / content
  // second (RIGHT), matching the sky mockup (image-left / content-right).
  layout: { imagePosition: 'left' },
}

test.describe('forest/sky campaign geometry (desktop)', () => {
  test('forest renders a 50/50 grid with content-LEFT / image-RIGHT, ~42px heading, ~238x56 CTA, square green close', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'Mobile Chrome', 'desktop campaign layout')
    await page.goto(harnessUrl(forestCampaign))
    const dialog = page.locator('.enlb-dialog')
    const image = page.locator('.enlb-image')
    const content = page.locator('.enlb-content')
    const title = page.locator('.enlb-title')
    // Primary CTA only — the secondary link also carries .enlb-cta.
    const cta = page.locator('.enlb-cta:not(.enlb-cta--secondary)')
    const close = page.locator('.enlb-close')
    await expect(dialog).toBeVisible()

    // ~835px desktop modal (max-width calc(100vw - 60px) on a 1280px viewport).
    const dialogBox = await dialog.boundingBox()
    expect(dialogBox).not.toBeNull()
    expect(dialogBox!.width).toBeGreaterThanOrEqual(830)
    expect(dialogBox!.width).toBeLessThanOrEqual(840)

    // 50/50: image and content each ~half the dialog, adjacent with no gap.
    const imageBox = await image.boundingBox()
    const contentBox = await content.boundingBox()
    expect(imageBox).not.toBeNull()
    expect(contentBox).not.toBeNull()
    expect(imageBox!.height).toBeGreaterThanOrEqual(dialogBox!.height - 2) // full modal height
    expect(contentBox!.height).toBeGreaterThanOrEqual(dialogBox!.height - 2)
    // Both columns ~half the dialog width.
    expect(contentBox!.width).toBeGreaterThan(dialogBox!.width * 0.45)
    expect(contentBox!.width).toBeLessThan(dialogBox!.width * 0.55)
    expect(imageBox!.width).toBeGreaterThan(dialogBox!.width * 0.45)
    expect(imageBox!.width).toBeLessThan(dialogBox!.width * 0.55)
    // No gap: content's right edge ~= image's left edge.
    expect(Math.abs((contentBox!.x + contentBox!.width) - imageBox!.x)).toBeLessThanOrEqual(1)

    // Order follows imagePosition ('right' → content LEFT / image RIGHT); grid
    // follows DOM order (content-then-image), no double-reverse.
    expect(contentBox!.x).toBeLessThan(imageBox!.x)

    // Campaign typography.
    const titleSize = await title.evaluate((el) => getComputedStyle(el).fontSize)
    expect(titleSize).toBe('42px')
    const titleWeight = await title.evaluate((el) => getComputedStyle(el).fontWeight)
    expect(titleWeight).toBe('800')

    // CTA ~238x56, square (radius 0).
    const ctaBox = await cta.boundingBox()
    expect(ctaBox).not.toBeNull()
    expect(ctaBox!.width).toBeGreaterThanOrEqual(234)
    expect(ctaBox!.width).toBeLessThanOrEqual(242)
    expect(ctaBox!.height).toBeGreaterThanOrEqual(54)
    expect(ctaBox!.height).toBeLessThanOrEqual(58)
    const ctaRadius = await cta.evaluate((el) => getComputedStyle(el).borderRadius)
    expect(ctaRadius).toBe('0px')
    const ctaTransform = await cta.evaluate((el) => getComputedStyle(el).textTransform)
    expect(ctaTransform).toBe('uppercase')

    // Forest close: green square ~44x42 over the image, top-right.
    const closeBox = await close.boundingBox()
    expect(closeBox).not.toBeNull()
    expect(closeBox!.width).toBeGreaterThanOrEqual(42)
    expect(closeBox!.width).toBeLessThanOrEqual(46)
    expect(closeBox!.height).toBeGreaterThanOrEqual(40)
    expect(closeBox!.height).toBeLessThanOrEqual(44)
    const closeBg = await close.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(closeBg).toBe('rgb(0, 101, 55)') // green square
  })

  test('sky renders a 50/50 grid with image-LEFT / content-RIGHT (overrides DOM), black CTA, no-box black close', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'Mobile Chrome', 'desktop campaign layout')
    await page.goto(harnessUrl(skyCampaign))
    const dialog = page.locator('.enlb-dialog')
    const image = page.locator('.enlb-image')
    const content = page.locator('.enlb-content')
    // Primary CTA only — the secondary link also carries .enlb-cta.
    const cta = page.locator('.enlb-cta:not(.enlb-cta--secondary)')
    const close = page.locator('.enlb-close')
    await expect(dialog).toBeVisible()

    const imageBox = await image.boundingBox()
    const contentBox = await content.boundingBox()
    expect(imageBox).not.toBeNull()
    expect(contentBox).not.toBeNull()

    // Order follows imagePosition ('left' → image LEFT / content RIGHT); grid
    // follows DOM order (image-then-content), no double-reverse.
    expect(imageBox!.x).toBeLessThan(contentBox!.x)

    // Black primary CTA, square, ~238x56.
    const ctaBox = await cta.boundingBox()
    expect(ctaBox).not.toBeNull()
    expect(ctaBox!.width).toBeGreaterThanOrEqual(234)
    expect(ctaBox!.width).toBeLessThanOrEqual(242)
    expect(ctaBox!.height).toBeGreaterThanOrEqual(54)
    expect(ctaBox!.height).toBeLessThanOrEqual(58)
    const ctaBg = await cta.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(ctaBg).toBe('rgb(0, 0, 0)') // black CTA
    const ctaText = await cta.evaluate((el) => getComputedStyle(el).color)
    expect(ctaText).toBe('rgb(255, 255, 255)') // white CTA text

    // Sky close: no box (transparent), black ~24px ×, top-right. The hit area
    // reuses the generic 44×44 box (kept transparent) for an accessible target.
    const closeBox = await close.boundingBox()
    expect(closeBox).not.toBeNull()
    expect(closeBox!.width).toBeGreaterThanOrEqual(42)
    expect(closeBox!.height).toBeGreaterThanOrEqual(42)
    const closeBg = await close.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(closeBg).toBe('rgba(0, 0, 0, 0)') // no box
    const closeColor = await close.evaluate((el) => getComputedStyle(el).color)
    expect(closeColor).toBe('rgb(0, 0, 0)') // black ×
    // The × is a 24px ::before line (font-size:0 hides the text glyph); assert
    // the pseudo-element line length, not the (now 0) font-size.
    const closeLine = await close.evaluate((el) => getComputedStyle(el, '::before').width)
    expect(closeLine).toBe('24px')
  })
})

// ── Unified campaign layout across ALL themes (issue #49) ─────────────────────
// Themes are now COLOR-ONLY variants: light/dark/brand adopt the FULL campaign
// layout (50/50 grid, ~835px modal, 42px heading, centered content, 238x56 CTA)
// that forest/sky already had. jsdom can't read shadow computed style, so the
// grid/typography/centering are asserted here against a real browser. Desktop
// only — Mobile Chrome is skipped (image hidden + stacked layout).
const unifiedCampaignBase = {
  ...baseConfig,
  eyebrow: 'Last chance',
  header: 'Protect what remains of our wild places',
  body: 'Your monthly gift defends forests, rivers, and wildlife all year long.',
  cta: { label: 'Give monthly', href: '#give' },
  secondaryCta: { label: 'Maybe later', href: '#later' },
  triggers: { time: 50 },
}

const themeCases: Array<{ name: string; preset: string; imagePosition: 'left' | 'right' }> = [
  { name: 'light', preset: 'light', imagePosition: 'left' },
  { name: 'dark', preset: 'dark', imagePosition: 'left' },
  { name: 'brand', preset: 'brand', imagePosition: 'left' },
]

test.describe('unified campaign layout across light/dark/brand (desktop)', () => {
  for (const tc of themeCases) {
    test(`${tc.name} renders the 50/50 grid, ~835px modal, 42px heading, centered content, 238x56 CTA`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'Mobile Chrome', 'desktop campaign layout')
      await page.goto(
        harnessUrl({
          ...unifiedCampaignBase,
          theme: { preset: tc.preset },
          layout: { imagePosition: tc.imagePosition },
        }),
      )
      const dialog = page.locator('.enlb-dialog')
      const layout = page.locator('.enlb-layout')
      const image = page.locator('.enlb-image')
      const content = page.locator('.enlb-content')
      const title = page.locator('.enlb-title')
      const cta = page.locator('.enlb-cta:not(.enlb-cta--secondary)')
      await expect(dialog).toBeVisible()

      // ~835px desktop modal (campaign max-width), NOT the old 900px cap.
      const dialogBox = await dialog.boundingBox()
      expect(dialogBox).not.toBeNull()
      expect(dialogBox!.width).toBeGreaterThanOrEqual(830)
      expect(dialogBox!.width).toBeLessThanOrEqual(840)

      // 50/50 grid: display:grid + two equal columns, each ~half the dialog.
      const layoutDisplay = await layout.evaluate((el) => getComputedStyle(el).display)
      expect(layoutDisplay).toBe('grid')
      const imageBox = await image.boundingBox()
      const contentBox = await content.boundingBox()
      expect(imageBox).not.toBeNull()
      expect(contentBox).not.toBeNull()
      expect(contentBox!.width).toBeGreaterThan(dialogBox!.width * 0.45)
      expect(contentBox!.width).toBeLessThan(dialogBox!.width * 0.55)
      expect(imageBox!.width).toBeGreaterThan(dialogBox!.width * 0.45)
      expect(imageBox!.width).toBeLessThan(dialogBox!.width * 0.55)

      // Campaign typography: 42px / 800 heading.
      const titleSize = await title.evaluate((el) => getComputedStyle(el).fontSize)
      expect(titleSize).toBe('42px')
      const titleWeight = await title.evaluate((el) => getComputedStyle(el).fontWeight)
      expect(titleWeight).toBe('800')

      // Centered campaign content.
      const contentAlign = await content.evaluate((el) => getComputedStyle(el).textAlign)
      expect(contentAlign).toBe('center')
      const contentItems = await content.evaluate((el) => getComputedStyle(el).alignItems)
      expect(contentItems).toBe('center')

      // CTA ~238x56, square (radius 0), uppercase.
      const ctaBox = await cta.boundingBox()
      expect(ctaBox).not.toBeNull()
      expect(ctaBox!.width).toBeGreaterThanOrEqual(234)
      expect(ctaBox!.width).toBeLessThanOrEqual(242)
      expect(ctaBox!.height).toBeGreaterThanOrEqual(54)
      expect(ctaBox!.height).toBeLessThanOrEqual(58)
      const ctaRadius = await cta.evaluate((el) => getComputedStyle(el).borderRadius)
      expect(ctaRadius).toBe('0px')
      const ctaTransform = await cta.evaluate((el) => getComputedStyle(el).textTransform)
      expect(ctaTransform).toBe('uppercase')
    })
  }
})

// ── Dark theme inverted CTA (white bg + dark text) ───────────────────────────
// The dark theme's default CTA is an inverted white button with #1f1f1f text
// (matching forest's inverted pattern), so it reads as a solid white CTA on the
// #1f1f1f dark surface. jsdom can't read shadow computed style (LEARNINGS.md),
// so the SCSS values are asserted here against a real browser.
test('dark theme default CTA is an inverted white button with dark text', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'Mobile Chrome', 'desktop campaign layout (mobile stacks)')
  await page.goto(
    harnessUrl({ ...unifiedCampaignBase, theme: { preset: 'dark' }, triggers: { time: 50 } }),
  )
  const cta = page.locator('.enlb-cta:not(.enlb-cta--secondary)')
  await expect(cta).toBeVisible()
  const ctaBg = await cta.evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(ctaBg).toBe('rgb(255, 255, 255)') // white CTA bg
  const ctaText = await cta.evaluate((el) => getComputedStyle(el).color)
  expect(ctaText).toBe('rgb(31, 31, 31)') // #1f1f1f CTA text
})

// ── Forest/sky responsive (~700px stack; global 640px breakpoint untouched) ────
test.describe('forest/sky responsive stacking (~700px)', () => {
  test('forest stacks vertically below ~700px: modal ~calc(100vw-32px), heading ~34px, content above image', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'Mobile Chrome', 'uses a custom desktop-width viewport')
    await page.setViewportSize({ width: 680, height: 800 })
    await page.goto(
      harnessUrl({ ...forestCampaign, layout: { imagePosition: 'right', hideImageOnMobile: false } }),
    )
    const dialog = page.locator('.enlb-dialog')
    const image = page.locator('.enlb-image')
    const content = page.locator('.enlb-content')
    const title = page.locator('.enlb-title')
    await expect(dialog).toBeVisible()

    // Modal width ~= calc(100vw - 32px) = 648px.
    const dialogBox = await dialog.boundingBox()
    expect(dialogBox).not.toBeNull()
    expect(dialogBox!.width).toBeGreaterThanOrEqual(644)
    expect(dialogBox!.width).toBeLessThanOrEqual(652)

    // Stacked: image and content share the same x (single column), content above
    // image (imagePosition:'right' → DOM content-then-image → grid keeps that
    // order top→bottom in a single column).
    const imageBox = await image.boundingBox()
    const contentBox = await content.boundingBox()
    expect(imageBox).not.toBeNull()
    expect(contentBox).not.toBeNull()
    expect(Math.abs(imageBox!.x - contentBox!.x)).toBeLessThanOrEqual(2)
    expect(contentBox!.y).toBeLessThan(imageBox!.y) // DOM order preserved: content→image

    // Heading shrinks to ~34px.
    const titleSize = await title.evaluate((el) => getComputedStyle(el).fontSize)
    expect(titleSize).toBe('34px')
  })
})

// ── Negative: outside-close never clipped; unknown preset stays light ──────────
test('forest with closeButton outside keeps the outside × visible and clickable (overflow not clipped)', async ({ page }) => {
  await page.goto(
    harnessUrl({ ...forestCampaign, layout: { closeButton: 'outside' } }),
  )
  const overlay = page.locator('.enlb-overlay')
  const close = page.locator('.enlb-close')
  await expect(overlay).toBeVisible()
  // The outside × sits above the dialog (negative top); forest/sky overflow:hidden
  // is scoped to the inside-close case, so this must NOT be clipped.
  await expect(close).toBeVisible()
  await close.click()
  await expect(overlay).toHaveCount(0)
})

// ── Close button must paint ABOVE an opaque image (z-index / paint order) ──────
// buildDom appends the close button BEFORE the layout (lightbox.ts buildDom), and
// both .enlb-close and .enlb-img are position:absolute with z-index:auto, so
// without an explicit z-index the opaque image paints OVER the close button and
// swallows the click. baseConfig's transparent 1×1 GIF hides this; a real opaque
// photo exposes it. Use a forest config with imagePosition:'right' (image on the
// right, close button top-right over the image) to match the client scenario.
test('close button is clickable over an opaque image (forest, imagePosition right)', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'Mobile Chrome', 'desktop two-column layout (mobile stacks)')
  // A solid-fill SVG renders as a fully opaque rectangle.
  const opaqueImage =
    "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27400%27 height=%27400%27%3E%3Crect width=%27100%25%27 height=%27100%25%27 fill=%27%23cc3333%27/%3E%3C/svg%3E"
  await page.goto(
    harnessUrl({
      ...baseConfig,
      image: { src: opaqueImage, alt: '' },
      header: 'Stay with us',
      eyebrow: 'Last Chance',
      cta: { label: 'Give monthly', href: '#give' },
      triggers: { time: 50 },
      theme: { preset: 'forest' },
      layout: { imagePosition: 'right' },
    }),
  )
  const overlay = page.locator('.enlb-overlay')
  const close = page.locator('.enlb-close')
  await expect(overlay).toBeVisible()
  await expect(close).toBeVisible()
  // Clicking the close button must close the lightbox. Before the z-index fix the
  // opaque image covers the close button, so the click lands on the image and the
  // lightbox stays open.
  await close.click()
  await expect(overlay).toHaveCount(0)
})

test('an unknown preset degrades to light and inherits the unified campaign layout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'Mobile Chrome', 'desktop-only: campaign/light widths only differ on desktop')
  await page.goto(
    harnessUrl({
      ...baseConfig,
      triggers: { time: 50 },
      theme: { preset: 'bogus' as unknown as 'light' },
    }),
  )
  const overlay = page.locator('.enlb-overlay')
  await expect(overlay).toHaveClass(/enlb-theme-light/)
  await expect(overlay).not.toHaveClass(/enlb-theme-forest/)
  await expect(overlay).not.toHaveClass(/enlb-theme-sky/)
  const dialog = page.locator('.enlb-dialog')
  const layout = page.locator('.enlb-layout')
  const dialogBox = await dialog.boundingBox()
  expect(dialogBox).not.toBeNull()
  // Themes are color-only now: light (the degrade target) inherits the generic
  // campaign layout — ~835px modal + 50/50 grid — like every other theme.
  expect(dialogBox!.width).toBeGreaterThanOrEqual(830)
  expect(dialogBox!.width).toBeLessThanOrEqual(840)
  const layoutDisplay = await layout.evaluate((el) => getComputedStyle(el).display)
  expect(layoutDisplay).toBe('grid')
})

