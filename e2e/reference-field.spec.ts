import { test, expect, type Page } from '@playwright/test'
import { harnessUrl } from './helpers'

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
