import { test, expect } from '@playwright/test'
import { harnessUrl } from './helpers'

test('opens, accepts, and closes without utag or page errors', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') pageErrors.push(message.text())
  })

  await page.goto(
    harnessUrl({
      header: 'Degraded analytics',
      body: 'No analytics vendor is installed.',
      cta: { label: 'Accept', href: '#accepted' },
      triggers: { time: 50, frequencyDays: 0 },
    }),
  )

  expect(await page.evaluate(() => 'utag' in window)).toBe(false)
  await expect(page.locator('.enlb-overlay')).toBeVisible()
  await page.locator('.enlb-cta:not(.enlb-cta--secondary)').click()
  await expect(page).toHaveURL(/#accepted$/)
  await page.locator('.enlb-close').click()
  await expect(page.locator('.enlb-overlay')).toHaveCount(0)
  expect(pageErrors).toEqual([])
})
