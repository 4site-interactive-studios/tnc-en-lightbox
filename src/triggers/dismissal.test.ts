import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { dismissalKey, isEligible, stamp } from './dismissal'

describe('dismissal (frequency-capped)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('dismissalKey derives the frozen enlb:shown:${pathname} format', () => {
    expect(dismissalKey('/campaign')).toBe('enlb:shown:/campaign')
    expect(dismissalKey('/')).toBe('enlb:shown:/')
  })

  it('isEligible returns true when no record exists', () => {
    expect(isEligible(7, '/')).toBe(true)
  })

  it('isEligible returns false when a fresh record is inside frequencyDays', () => {
    stamp('/')
    expect(isEligible(7, '/')).toBe(false)
  })

  it('isEligible returns true when the record is older than frequencyDays', () => {
    const old = Date.now() - 8 * 86_400_000
    localStorage.setItem('enlb:shown:/', String(old))
    expect(isEligible(7, '/')).toBe(true)
  })

  it('isEligible returns true when frequencyDays is 0 (every load)', () => {
    stamp('/')
    expect(isEligible(0, '/')).toBe(true)
  })

  it('isEligible fails OPEN when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    expect(isEligible(7, '/')).toBe(true)
  })

  it('stamp writes Date.now() to localStorage under the dismissal key', () => {
    const before = Date.now()
    stamp('/')
    const stored = Number(localStorage.getItem('enlb:shown:/'))
    expect(stored).toBeGreaterThanOrEqual(before)
  })

  it('stamp does NOT throw when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    expect(() => stamp('/')).not.toThrow()
  })

  it('round-trip: stamp on path A blocks A but not B', () => {
    stamp('/A')
    expect(isEligible(7, '/A')).toBe(false)
    expect(isEligible(7, '/B')).toBe(true)
  })

  it('isEligible fails OPEN when the stored value is corrupt (non-numeric)', () => {
    localStorage.setItem('enlb:shown:/', 'abc')
    expect(isEligible(7, '/')).toBe(true)
  })
})
