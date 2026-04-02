import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  globalSetup: './global-setup.ts',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'https://avasafe.ai',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on-first-retry',
    actionTimeout: 15000,
    navigationTimeout: 20000,
  },
  outputDir: './screenshots',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
