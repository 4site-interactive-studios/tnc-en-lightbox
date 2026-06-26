import { test, expect } from '@playwright/test'
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

test('scroll-depth trigger opens after scrolling', async ({ page }) => {
  await page.goto(harnessUrl({ ...baseConfig, triggers: { scroll: 50 } }))
  await page.evaluate(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo(0, maxScroll * 0.5)
  })
  await expect(page.locator('.enlb-overlay')).toBeVisible()
})

