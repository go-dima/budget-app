import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  // The app must already be running via `npm run dev` before running tests.
});
