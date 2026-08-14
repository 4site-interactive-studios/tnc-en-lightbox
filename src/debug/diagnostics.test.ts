import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildTealiumPayload } from '../analytics/payloads'
import { installDiagnosticsListeners } from './diagnostics'

type UtagWindow = Window & {
  utag?: unknown
}

const hostWindow = window as UtagWindow
let uninstall: (() => void) | undefined
let logSpy: ReturnType<typeof vi.spyOn>

function setSearch(search: string): void {
  window.history.replaceState({}, '', search || '/')
}

function dispatch(name: string, detail: unknown = {}): void {
  document.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }))
}

function logCalls(): unknown[][] {
  return logSpy.mock.calls as unknown[][]
}

function hasLog(prefix: string, detail?: unknown): boolean {
  return logCalls().some((call) => {
    if (typeof call[0] !== 'string' || !call[0].includes(prefix)) return false
    return detail === undefined || JSON.stringify(call[1]) === JSON.stringify(detail)
  })
}

function expectSilent(search: string): void {
  setSearch(search)
  uninstall = installDiagnosticsListeners()
  dispatch('enlb:open')
  expect(logSpy).not.toHaveBeenCalled()
}

beforeEach(() => {
  setSearch('/')
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  delete hostWindow.utag
})

afterEach(() => {
  uninstall?.()
  uninstall = undefined
  setSearch('/')
  delete hostWindow.utag
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('diagnostics activation', () => {
  it('activates diagnostics for debug=true', () => {
    setSearch('?debug=true')
    uninstall = installDiagnosticsListeners()

    dispatch('enlb:open')

    expect(hasLog('enlb:open')).toBe(true)
  })

  it('activates diagnostics for debug=log', () => {
    setSearch('?debug=log')
    uninstall = installDiagnosticsListeners()

    dispatch('enlb:open')

    expect(hasLog('enlb:open')).toBe(true)
  })

  it('stays silent when debug is absent', () => {
    expectSilent('/')
  })

  it('stays silent for debug=false', () => {
    expectSilent('?debug=false')
  })

  it('stays silent for debug=1', () => {
    expectSilent('?debug=1')
  })

  it('stays silent for arbitrary debug values', () => {
    expectSilent('?debug=verbose')
  })

  it('stays silent for a malformed debug query', () => {
    expectSilent('?debug=%E0%A4%A')
  })
})

describe('diagnostic event and payload output', () => {
  it('retains lifecycle detail including CTA role and frozen dismiss reason/pathname', () => {
    setSearch('?debug=true')
    hostWindow.utag = { link: vi.fn() }
    uninstall = installDiagnosticsListeners()

    dispatch('enlb:open', {})
    dispatch('enlb:cta', { role: 'primary' })
    dispatch('enlb:dismiss', { reason: 'cta-primary', pathname: '/campaign' })

    expect(hasLog('enlb:open', {})).toBe(true)
    expect(hasLog('enlb:cta', { role: 'primary' })).toBe(true)
    expect(hasLog('enlb:dismiss', { reason: 'cta-primary', pathname: '/campaign' })).toBe(true)
  })

  it('logs exact payload objects produced by the imported wire payload builder', () => {
    setSearch('?debug=log')
    hostWindow.utag = { link: vi.fn() }
    uninstall = installDiagnosticsListeners()

    dispatch('enlb:open')
    dispatch('enlb:cta', { role: 'primary' })

    expect(hasLog('utag payload', buildTealiumPayload('impression'))).toBe(true)
    expect(hasLog('utag payload', buildTealiumPayload('click'))).toBe(true)
  })

  it('logs field write and replay details', () => {
    setSearch('?debug=true')
    uninstall = installDiagnosticsListeners()

    dispatch('enlb:field-write', {
      action: 'write',
      field: 'en_txn3',
      value: 'lightbox_accepted',
    })
    dispatch('enlb:field-write', {
      action: 'replay',
      field: 'en_txn3',
      value: 'lightbox_declined',
    })

    expect(
      hasLog('enlb:field-write', {
        action: 'write',
        field: 'en_txn3',
        value: 'lightbox_accepted',
      }),
    ).toBe(true)
    expect(
      hasLog('enlb:field-write', {
        action: 'replay',
        field: 'en_txn3',
        value: 'lightbox_declined',
      }),
    ).toBe(true)
  })

  it('logs the builder payload as a would-fire QA line when utag is absent', () => {
    setSearch('?debug=true')
    uninstall = installDiagnosticsListeners()

    dispatch('enlb:open')

    expect(hasLog('utag absent — would fire:', buildTealiumPayload('impression'))).toBe(true)
  })

  it('does not log a payload for non-primary CTA roles', () => {
    setSearch('?debug=true')
    uninstall = installDiagnosticsListeners()

    dispatch('enlb:cta', { role: 'secondary' })

    expect(logCalls().some((call) => typeof call[0] === 'string' && call[0].includes('utag payload'))).toBe(false)
    expect(logCalls().some((call) => typeof call[0] === 'string' && call[0].includes('utag absent'))).toBe(false)
  })

  it.each([null, 'malformed', ['primary']])(
    'never throws or logs a payload for malformed CTA detail: %j',
    (detail) => {
      setSearch('?debug=true')
      hostWindow.utag = { link: vi.fn() }
      uninstall = installDiagnosticsListeners()

      expect(() => dispatch('enlb:cta', detail)).not.toThrow()
      expect(hasLog('enlb:cta')).toBe(true)
      expect(
        logCalls().some(
          (call) => typeof call[0] === 'string' && call[0].includes('enlb:cta') && call[1] === undefined,
        ),
      ).toBe(true)
      expect(logCalls().some((call) => typeof call[0] === 'string' && call[0].includes('utag '))).toBe(false)
      expect((hostWindow.utag as { link: ReturnType<typeof vi.fn> }).link).not.toHaveBeenCalled()
    },
  )
})

describe('diagnostics degradation', () => {
  it('never throws or logs when URLSearchParams rejects a hostile URL', () => {
    setSearch('?debug=true')
    vi.stubGlobal(
      'URLSearchParams',
      class HostileURLSearchParams {
        constructor() {
          throw new Error('hostile URL')
        }
      },
    )

    expect(() => {
      uninstall = installDiagnosticsListeners()
      dispatch('enlb:open')
    }).not.toThrow()
    expect(logSpy).not.toHaveBeenCalled()
  })

  it('never throws when the console is frozen and its logger is hostile', () => {
    setSearch('?debug=true')
    vi.stubGlobal(
      'console',
      Object.freeze({
        get log() {
          throw new Error('hostile console')
        },
      }),
    )
    uninstall = installDiagnosticsListeners()

    expect(() => dispatch('enlb:open')).not.toThrow()
  })

  it('never throws when console is missing', () => {
    setSearch('?debug=true')
    vi.stubGlobal('console', undefined)
    uninstall = installDiagnosticsListeners()

    expect(() => dispatch('enlb:open')).not.toThrow()
  })
})
