import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: {
    baseURL: "http://localhost:59107",
    viewport: { width: 1280, height: 900 },
  },
  reporter: [
    ["html"],
    ["list"],
  ],
  retries: 0,
  workers: 1,
  timeout: 30000,
  testDir: "./tests",
  testMatch: /.*\.spec\.ts/,
});
