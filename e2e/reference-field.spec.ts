import { test, expect, type Page } from '@playwright/test'
import { harnessUrl } from './helpers'
import { installUtagStub, recordedUtagCalls } from './utag-stub'

const FIELD = 'en_txn3'
const baseConfig = {
  header: 'Reference field header',
  body: 'Reference field body',
  en: { referenceField: FIELD },
  triggers: { time: 50, frequencyDays: 0 },
}

async function expectFormSubmits(page: Page): Promise<void> {
  const result = await page.locator('#en-form').evaluate((element) => {
    const form = element as HTMLFormElement
    const email = form.elements.namedItem('email') as HTMLInputElement
    const name = form.elements.namedItem('name') as HTMLInputElement
    email.value = 'test@example.com'
    name.value = 'Test'

    let fired = false
    let defaultPrevented = true
    form.addEventListener(
      'submit',
      (event) => {
        fired = true
        defaultPrevented = event.defaultPrevented
      },
      { once: true },
    )
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }))
    return { fired, defaultPrevented, valid: form.checkValidity() }
  })

  expect(result).toEqual({ fired: true, defaultPrevented: false, valid: true })
}

async function clearRecordedUtagCalls(page: Page): Promise<void> {
  await page.evaluate(() => {
    const target = window as Window & { __enlbUtagCalls?: unknown[] }
    target.__enlbUtagCalls?.splice(0)
  })
}

test('writes accepted for a close-action primary CTA and preserves form submission', async ({ page }) => {
  await page.goto(harnessUrl({
    ...baseConfig,
    cta: { label: 'Accept', action: 'close' },
  }))
  await expect(page.locator('.enlb-overlay')).toBeVisible()

  await page.locator('.enlb-cta:not(.enlb-cta--secondary)').click()
  await expect(page.locator('.enlb-overlay')).toHaveCount(0)
  await expect(page.locator(`#en-form input[name="${FIELD}"]`)).toHaveCount(1)
  await expect(page.locator(`#en-form input[name="${FIELD}"]`)).toHaveValue('lightbox_accepted')
  await expect(page.locator(`#en-form input[name="${FIELD}"]`)).not.toHaveAttribute('required')
  await expectFormSubmits(page)
})

test('writes accepted before native redirect and replays once on the destination page', async ({ page }) => {
  const destination = '/e2e/carry-over.html'

  await page.goto(
    harnessUrl({
      ...baseConfig,
      cta: { label: 'Continue', href: destination, action: 'redirect' },
    }),
  )
  await expect(page.locator('.enlb-overlay')).toBeVisible()
  await expect(page.locator('.enlb-cta:not(.enlb-cta--secondary)')).toHaveAttribute('href', destination)
  await page.locator('.enlb-cta:not(.enlb-cta--secondary)').click()

  await expect(page).toHaveURL(/\/e2e\/carry-over\.html$/)
  await expect(page.locator(`#en-form input[name="${FIELD}"]`)).toHaveCount(1)
  await expect(page.locator(`#en-form input[name="${FIELD}"]`)).toHaveValue('lightbox_accepted')
  await expect(page.locator(`#en-form input[name="${FIELD}"]`)).not.toHaveAttribute('required')
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0)
  await expectFormSubmits(page)
})

test('defers carry-over replay for a documented head embed until the parsed destination form is ready', async ({ page }) => {
  const destination = '/e2e/carry-over-head.html'

  await page.goto(
    harnessUrl({
      ...baseConfig,
      cta: { label: 'Continue', href: destination, action: 'redirect' },
    }),
  )
  await expect(page.locator('.enlb-overlay')).toBeVisible()
  await page.locator('.enlb-cta:not(.enlb-cta--secondary)').click()

  await expect(page).toHaveURL(/\/e2e\/carry-over-head\.html$/)
  await expect(page.locator(`#en-form input[name="${FIELD}"]`)).toHaveCount(1)
  await expect(page.locator(`#en-form input[name="${FIELD}"]`)).toHaveValue('lightbox_accepted')
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0)
  await expectFormSubmits(page)
})

test.describe('Tealium and reference-field public boundary', () => {
  test('a primary accept emits one click and writes the accepted field for the same interaction', async ({ page }) => {
    await installUtagStub(page)
    await page.goto(
      harnessUrl({
        ...baseConfig,
        cta: { label: 'Accept', action: 'close' },
      }),
    )
    await expect(page.locator('.enlb-overlay')).toBeVisible()

    await page.locator('.enlb-cta:not(.enlb-cta--secondary)').click()

    const clickCalls = (await recordedUtagCalls(page)).filter((call) => call.event_name === 'lightbox_click')
    expect(clickCalls).toEqual([{ event_name: 'lightbox_click', lightbox_name: 'inactivity-exit' }])
    await expect(page.locator(`#en-form input[name="${FIELD}"]`)).toHaveValue('lightbox_accepted')
  })

  const trackedDeclineCases = [
    {
      name: 'Escape',
      close: async (page: Page) => page.keyboard.press('Escape'),
    },
    {
      name: 'close button',
      close: async (page: Page) => page.locator('.enlb-close').click(),
    },
    {
      name: 'overlay click',
      close: async (page: Page) => page.locator('.enlb-overlay').click({ position: { x: 5, y: 5 } }),
    },
  ] as const

  for (const declineCase of trackedDeclineCases) {
    test(`a ${declineCase.name} decline emits no Tealium calls and writes the declined field for the same interaction`, async ({ page }) => {
      await installUtagStub(page)
      await page.goto(
        harnessUrl({
          ...baseConfig,
          cta: { label: 'Accept', action: 'close' },
        }),
      )
      await expect(page.locator('.enlb-overlay')).toBeVisible()
      await clearRecordedUtagCalls(page)

      await declineCase.close(page)

      expect(await recordedUtagCalls(page)).toEqual([])
      await expect(page.locator(`#en-form input[name="${FIELD}"]`)).toHaveValue('lightbox_declined')
    })
  }
})

const declineCases = [
  {
    name: 'close button',
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
    name: 'dismiss CTA',
    config: { dismissLabel: 'No thanks' },
    close: async (page: Page) => page.locator('.enlb-cta--secondary').click(),
  },
  {
    name: 'secondary close CTA',
    config: { secondaryCta: { label: 'Maybe later', action: 'close' as const } },
    close: async (page: Page) => page.locator('.enlb-cta--secondary').click(),
  },
  {
    name: 'API close',
    config: {},
    close: async (page: Page) =>
      page.evaluate(() => {
        ;(window as unknown as { ENLightboxAPI: { close: () => void } }).ENLightboxAPI.close()
      }),
  },
] as const

for (const declineCase of declineCases) {
  test(`writes declined for ${declineCase.name}`, async ({ page }) => {
    await page.goto(
      harnessUrl({
        ...baseConfig,
        ...declineCase.config,
        cta: { label: 'Accept', href: '#accepted' },
      }),
    )
    await expect(page.locator('.enlb-overlay')).toBeVisible()

    await declineCase.close(page)
    await expect(page.locator('.enlb-overlay')).toHaveCount(0)
    await expect(page.locator(`#en-form input[name="${FIELD}"]`)).toHaveValue('lightbox_declined')
    await expectFormSubmits(page)
  })
}
