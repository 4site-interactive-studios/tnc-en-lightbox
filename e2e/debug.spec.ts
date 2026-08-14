import { test, expect, type Page } from '@playwright/test'
import { harnessUrl } from './helpers'
import { installUtagStub, recordedUtagCalls } from './utag-stub'

const baseConfig = {
  header: 'Diagnostics header',
  body: 'Diagnostics body',
  triggers: { time: 50, frequencyDays: 0 },
}

type ConsoleRecord = {
  text: string
  args: unknown[]
}

function captureConsole(page: Page, records: ConsoleRecord[]): void {
  page.on('console', (message) => {
    const record: ConsoleRecord = { text: message.text(), args: [] }
    records.push(record)
    void Promise.all(message.args().map((argument) => argument.jsonValue().catch(() => undefined))).then((args) => {
      record.args = args
    })
  })
}

function hasRecord(records: ConsoleRecord[], prefix: string, detail?: unknown): boolean {
  return records.some((record) => {
    if (!record.text.includes(prefix)) return false
    return detail === undefined || detailMatches(record.args[1], detail)
  })
}

function detailMatches(actual: unknown, expected: unknown): boolean {
  if (!expected || typeof expected !== 'object' || Array.isArray(expected)) {
    return JSON.stringify(actual) === JSON.stringify(expected)
  }
  if (!actual || typeof actual !== 'object' || Array.isArray(actual)) return false
  return Object.entries(expected).every(
    ([key, value]) => JSON.stringify((actual as Record<string, unknown>)[key]) === JSON.stringify(value),
  )
}

test('debug=true logs lifecycle, absent-utag QA payloads, and reference-field writes', async ({ page }) => {
  const records: ConsoleRecord[] = []
  captureConsole(page, records)

  await page.goto(
    `${harnessUrl({
      ...baseConfig,
      cta: { label: 'Accept', action: 'close' },
      en: { referenceField: 'en_txn3' },
    })}&debug=true`,
  )

  await expect(page.locator('.enlb-overlay')).toBeVisible()
  await page.locator('.enlb-cta:not(.enlb-cta--secondary)').click()
  await expect(page.locator('.enlb-overlay')).toHaveCount(0)

  await expect.poll(() => hasRecord(records, 'enlb:open', {})).toBe(true)
  await expect.poll(() => hasRecord(records, 'enlb:cta', { role: 'primary' })).toBe(true)
  await expect.poll(() => hasRecord(records, 'enlb:dismiss', { reason: 'cta-primary', pathname: '/e2e/harness.html' })).toBe(true)
  await expect.poll(() => hasRecord(records, 'enlb:field-write', { action: 'write', field: 'en_txn3', value: 'lightbox_accepted' })).toBe(true)
  await expect.poll(() => hasRecord(records, 'utag absent — would fire:', { event_name: 'lightbox_impression', lightbox_name: 'inactivity-exit' })).toBe(true)
  await expect.poll(() => hasRecord(records, 'utag absent — would fire:', { event_name: 'lightbox_click', lightbox_name: 'inactivity-exit' })).toBe(true)
})

test('debug=log logs exact wire payloads when utag is present', async ({ page }) => {
  const records: ConsoleRecord[] = []
  captureConsole(page, records)
  await installUtagStub(page)

  await page.goto(
    `${harnessUrl({
      ...baseConfig,
      cta: { label: 'Accept', action: 'close' },
    })}&debug=log`,
  )

  await expect(page.locator('.enlb-overlay')).toBeVisible()
  await page.locator('.enlb-cta:not(.enlb-cta--secondary)').click()
  await expect(page.locator('.enlb-overlay')).toHaveCount(0)

  await expect.poll(() => recordedUtagCalls(page)).toEqual([
    { event_name: 'lightbox_impression', lightbox_name: 'inactivity-exit' },
    { event_name: 'lightbox_click', lightbox_name: 'inactivity-exit' },
  ])
  await expect.poll(() => hasRecord(records, '[ENLightbox debug] utag payload:', { event_name: 'lightbox_impression', lightbox_name: 'inactivity-exit' })).toBe(true)
  await expect.poll(() => hasRecord(records, '[ENLightbox debug] utag payload:', { event_name: 'lightbox_click', lightbox_name: 'inactivity-exit' })).toBe(true)
})

test('normal open and close flow stays console-silent without a debug query', async ({ page }) => {
  const messages: string[] = []
  page.on('console', (message) => messages.push(message.text()))

  await page.goto(`${harnessUrl(baseConfig)}`)
  await expect(page.locator('.enlb-overlay')).toBeVisible()
  await page.locator('.enlb-close').click()
  await expect(page.locator('.enlb-overlay')).toHaveCount(0)

  expect(messages).toEqual([])
})
