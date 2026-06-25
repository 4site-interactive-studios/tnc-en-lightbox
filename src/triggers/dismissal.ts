const DAY_MS = 86_400_000

export function dismissalKey(pathname: string): string {
  return `enlb:shown:${pathname}`
}

export function isEligible(frequencyDays: number, pathname?: string): boolean {
  const path = pathname ?? location.pathname
  if (frequencyDays <= 0) return true
  try {
    const stored = localStorage.getItem(dismissalKey(path))
    if (!stored) return true
    const parsed = Number(stored)
    if (!Number.isFinite(parsed)) return true
    return Date.now() - parsed >= frequencyDays * DAY_MS
  } catch {
    return true
  }
}

export function stamp(pathname?: string): void {
  const path = pathname ?? location.pathname
  try {
    localStorage.setItem(dismissalKey(path), String(Date.now()))
  } catch {
    // storage unavailable — fail silently
  }
}
