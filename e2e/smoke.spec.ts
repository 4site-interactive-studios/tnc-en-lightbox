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

test('a malformed config never throws on the host page and the EN form stays interactive', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(
    harnessUrl({
      header: 'Malformed',
      body: 'B',
      cta: { label: 'Go', href: '#' },
      // triggers.list is a non-iterable value; pre-hardening this threw at script-eval time
      triggers: { list: 123 },
    }),
  )
  expect(errors).toEqual([])
  const form = page.locator('#en-form')
  await expect(form).toBeVisible()
  await form.locator('input[name="email"]').fill('test@example.com')
  await expect(form.locator('input[name="email"]')).toHaveValue('test@example.com')
  await expect(page.locator('.enlb-overlay')).toHaveCount(0)
})

