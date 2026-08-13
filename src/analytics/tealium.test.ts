import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildTealiumPayload } from './payloads'
import { installTealiumListeners } from './tealium'

type Utag = {
  link?: (payload: Record<string, string>) => void
}

const windowWithUtag = window as Window & { utag?: unknown }
let uninstall: (() => void) | undefined
let linkSpy: ReturnType<typeof vi.fn>

function dispatch(name: string, detail: object = {}): void {
  document.dispatchEvent(new CustomEvent(name, { detail }))
}

function setUtag(value: unknown): void {
  windowWithUtag.utag = value
}

beforeEach(() => {
  linkSpy = vi.fn()
  setUtag({ link: linkSpy as Utag['link'] } satisfies Utag)
  uninstall = installTealiumListeners()
})

afterEach(() => {
  uninstall?.()
  uninstall = undefined
  delete windowWithUtag.utag
  vi.restoreAllMocks()
})

describe('Tealium payloads', () => {
  it('builds the exact frozen impression payload', () => {
    expect(buildTealiumPayload('impression')).toEqual({
      event_name: 'lightbox_impression',
      lightbox_name: 'inactivity-exit',
    })
  })

  it('builds the exact frozen click payload', () => {
    expect(buildTealiumPayload('click')).toEqual({
      event_name: 'lightbox_click',
      lightbox_name: 'inactivity-exit',
    })
  })
})

describe('Tealium lifecycle reader', () => {
  it('sends one exact impression payload for each open event', () => {
    dispatch('enlb:open')
    dispatch('enlb:open')

    expect(linkSpy).toHaveBeenCalledTimes(2)
    expect(linkSpy).toHaveBeenNthCalledWith(1, {
      event_name: 'lightbox_impression',
      lightbox_name: 'inactivity-exit',
    })
    expect(linkSpy).toHaveBeenNthCalledWith(2, {
      event_name: 'lightbox_impression',
      lightbox_name: 'inactivity-exit',
    })
  })

  it('sends the exact click payload for a primary CTA, including a close-action dismissal', () => {
    dispatch('enlb:cta', { role: 'primary' })
    dispatch('enlb:dismiss', { reason: 'cta-primary', pathname: '/campaign' })

    expect(linkSpy).toHaveBeenCalledTimes(1)
    expect(linkSpy).toHaveBeenCalledWith({
      event_name: 'lightbox_click',
      lightbox_name: 'inactivity-exit',
    })
  })

  it.each([
    ['close button', 'close-button'],
    ['Escape', 'esc'],
    ['overlay', 'overlay'],
    ['decline CTA', 'cta-dismiss'],
    ['secondary CTA', 'cta-secondary'],
    ['API close', 'api'],
  ])('sends no payload for the %s dismissal path', (_label, reason) => {
    dispatch('enlb:dismiss', { reason, pathname: '/campaign' })
    if (reason === 'cta-dismiss') dispatch('enlb:cta', { role: 'dismiss' })
    if (reason === 'cta-secondary') dispatch('enlb:cta', { role: 'secondary' })

    expect(linkSpy).not.toHaveBeenCalled()
  })

  it('is silent when utag is absent', () => {
    setUtag(undefined)

    expect(() => dispatch('enlb:open')).not.toThrow()
    expect(linkSpy).not.toHaveBeenCalled()
  })

  it.each([null, {}, { link: null }, { link: 'not-a-function' }])(
    'is silent for a wrong-shaped utag value: %p',
    (utag) => {
      setUtag(utag)

      expect(() => dispatch('enlb:open')).not.toThrow()
      expect(linkSpy).not.toHaveBeenCalled()
    },
  )

  it('swallows a host-provided utag.link throw', () => {
    setUtag({
      link: () => {
        throw new Error('host failure')
      },
    })

    expect(() => dispatch('enlb:cta', { role: 'primary' })).not.toThrow()
    expect(linkSpy).not.toHaveBeenCalled()
  })
})
