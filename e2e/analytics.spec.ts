import { test, expect, type Page } from '@playwright/test'
import { harnessUrl } from './helpers'
import { installUtagStub, recordedUtagCalls } from './utag-stub'

const baseConfig = {
  header: 'Analytics header',
  body: 'Analytics body',
  triggers: { time: 50, frequencyDays: 0 },
}

const impression = {
  event_name: 'lightbox_impression',
  lightbox_name: 'inactivity-exit',
}

const click = {
  event_name: 'lightbox_click',
  lightbox_name: 'inactivity-exit',
}

test('tracks one exact impression per display and primary accept while navigation survives', async ({ page }) => {
  await installUtagStub(page)
  await page.goto(
    harnessUrl({
      ...baseConfig,
      cta: { label: 'Accept', href: '#accepted' },
    }),
  )

  await expect(page.locator('.enlb-overlay')).toBeVisible()
  await expect.poll(() => recordedUtagCalls(page)).toEqual([impression])

  await page.locator('.enlb-cta:not(.enlb-cta--secondary)').click()
  await expect(page).toHaveURL(/#accepted$/)
  await expect.poll(() => recordedUtagCalls(page)).toEqual([impression, click])
})

const negativeCases = [
  {
    name: 'X close',
    config: {},
    close: async (page: Page) => page.locator('.enlb-close').click(),
  },
  {
    name: 'Escape',
    config: {},
    close: async (page: Page) => page.keyboard.press('Escape'),
  },
  {
    name: 'overlay click',
    config: {},
    close: async (page: Page) => page.locator('.enlb-overlay').click({ position: { x: 5, y: 5 } }),
  },
  {
    name: 'decline button',
    config: { dismissLabel: 'No thanks' },
    close: async (page: Page) => page.locator('.enlb-cta--secondary').click(),
  },
  {
    name: 'secondary close',
    config: { secondaryCta: { label: 'Maybe later', action: 'close' as const } },
    close: async (page: Page) => page.locator('.enlb-cta--secondary').click(),
  },
] as const

for (const negativeCase of negativeCases) {
  test(`does not track ${negativeCase.name}`, async ({ page }) => {
    await installUtagStub(page)
    await page.goto(harnessUrl({ ...baseConfig, ...negativeCase.config }))
    await expect(page.locator('.enlb-overlay')).toBeVisible()
    await negativeCase.close(page)
    await expect(page.locator('.enlb-overlay')).toHaveCount(0)
    expect(await recordedUtagCalls(page)).toEqual([impression])
  })
}
