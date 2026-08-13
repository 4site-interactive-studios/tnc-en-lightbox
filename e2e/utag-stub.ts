import type { Page } from '@playwright/test'

export type RecordedUtagPayload = {
  event_name: string
  lightbox_name: string
}

type UtagWindow = Window & {
  __enlbUtagCalls?: RecordedUtagPayload[]
  utag?: {
    link: (payload: RecordedUtagPayload) => void
  }
}

export async function installUtagStub(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const calls: RecordedUtagPayload[] = []
    const target = window as UtagWindow
    target.__enlbUtagCalls = calls
    target.utag = {
      link(payload: RecordedUtagPayload): void {
        calls.push({ ...payload })
      },
    }
  })
}

export async function recordedUtagCalls(page: Page): Promise<RecordedUtagPayload[]> {
  return page.evaluate(() => {
    const calls = (window as UtagWindow).__enlbUtagCalls ?? []
    return calls.map((payload) => ({ ...payload }))
  })
}
