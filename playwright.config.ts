import { defineConfig } from '@playwright/test';
import { assertIsolatedTarget } from './backend/tests/fixtures/isolated-target.guard';

// Playwright's failure-context DOM snapshots include password input values.
// Keep diagnostics to safe assertions and versions; no credential-bearing DOM capture.
process.env.PLAYWRIGHT_NO_COPY_PROMPT = '1';

const baseURL = process.env.E2E_BASE_URL;
if (!baseURL || !/^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(baseURL))
  throw new Error('E2E_BASE_URL must explicitly identify the isolated local HTTPS origin.');
assertIsolatedTarget(process.env.E2E_TEST_DATABASE_URL ?? '');

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/auth.spec.ts', '**/administration.spec.ts'],
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  timeout: 30000,
  outputDir: '.verification/browser-results',
  reporter: [['list'], ['json', { outputFile: '.verification/browser-results/report.json' }]],
  use: {
    baseURL,
    ignoreHTTPSErrors: false,
    viewport: { width: 1440, height: 900 },
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    { name: 'chrome', use: { browserName: 'chromium', channel: 'chrome' } },
    { name: 'edge', use: { browserName: 'chromium', channel: 'msedge' } },
  ],
});
