import { test, expect } from "@playwright/test";

// Canonical KDCI subsidiary routes — absolute paths (no baseURL prefix).
const LIVE_ROUTES = [
  { path: "/",                     label: "Dashboard" },
  { path: "/travel-index/",        label: "VAGARY INDEX" },
  { path: "/quantum-wearables/",   label: "QUANTUM MODE" },
  { path: "/shoe-brand/",          label: "KINGDESIGNSHOECOMPANY" },
  { path: "/gaming/",              label: "KDCI GAMING" },
  { path: "/kids-channel/",        label: "SEVEN MINUTE STORY SESSIONS" },
  { path: "/innovation-hub/",      label: "KING DESIGN COLLECTIVE BRIHEIGHT BOX" },
  { path: "/ewaste-recycling/",    label: "KINGDESIGN E-COLLECTIVE" },
];

// Declared 404 standby — must NOT be 200.
test("still-alive-arcade/ -> declared 404 standby (not 200)", async ({ page }) => {
  const response = await page.goto("/still-alive-arcade/");
  expect(response?.status()).not.toBe(200);
});

// Full route audit: every route must return 200 with the shell present and no console errors.
for (const route of LIVE_ROUTES) {
  test(`${route.path} -> ${route.label} renders cleanly (200 + shell, no console errors)`, async ({ page }) => {
    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);
    // Shell must be present and rendered (single SPA shell across all routes).
    await expect(page.locator("main")).toBeVisible();
    // No uncaught console errors on page load.
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    await page.waitForTimeout(1200);
    expect(consoleErrors).toEqual([]);
  });
}
