import { test, expect } from '@playwright/test'
import { harnessUrl } from './helpers'

test('lightbox opens on time trigger', async ({ page }) => {
  await page.goto(harnessUrl({ header: 'H', body: 'B' }))
  const overlay = page.locator('.enlb-overlay')
  await expect(overlay).toBeVisible({ timeout: 500 })
})
