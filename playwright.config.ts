import { defineConfig, devices } from '@playwright/test'

/**
 * Cross-browser smoke configuration.
 *
 * Projects: Chromium (Chrome), Firefox, WebKit (Safari), and a mobile-viewport
 * Chromium project (Pixel 5). Microsoft Edge uses the Chromium engine; the
 * `msedge` channel can be enabled locally by adding a project with
 * `channel: 'msedge'`, but it is intentionally omitted from CI because Edge is
 * not installed in the GitHub Actions runner image.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'node e2e/server.mjs',
    url: 'http://localhost:8080/e2e/harness.html',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
