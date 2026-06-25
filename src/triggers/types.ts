export interface Trigger {
  arm(onFire: () => void): void
  disarm(): void
}
