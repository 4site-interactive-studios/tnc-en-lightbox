export function encodeConfig(config: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(config)).toString('base64url')
}

export function harnessUrl(config: Record<string, unknown>, hostCss?: string): string {
  const base = `/e2e/harness.html?cfg=${encodeConfig(config)}`
  return hostCss ? `${base}&hostcss=${encodeURIComponent(hostCss)}` : base
}
