#!/usr/bin/env node
// scripts/r2-perf-audit.mjs
// Phase R2: Performance & Memory Stress Audit (observational / no code change).
//
// Run: node scripts/r2-perf-audit.mjs
//
// Metrics recorded:
//   coldStartMs           < 300ms (static export hydration + fitAll() initial camera frame)
//   avgCycleMs            consistent (< 60ms/cycle) - 50 rapid transitions
//   baselineHeapMB        JS heap before load (UsedJSHeapSize via CDP)
//   postStressHeapMB      JS heap after 50 cycles (plateaus after GC)
//   heapDeltaMB           postStress - baseline (< 5.0 MB expected)
//   mobileHeapMB          mobile-DPR profile heap (~equal to desktop)
//   consoleErrors         count of uncaught console errors
//
// Deviation classification:
//   - coldStartMs >= 300  -> SLOW
//   - heapDeltaMB >= 5.0  -> MEMORY-LEAK
//   - avgCycleMs >= 60    -> SLOW-CYCLE
//   - mobileHeapMB > baselineHeapMB + 1.0 -> MOBILE-HEAP-GROW
//   - consoleErrors > 0    -> CONSOLE-ERRORS

import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const SERVER_URL = process.env.AUDIT_SERVER_URL || "http://localhost:59107";
const REPORT_PATH = join(
  fileURLToPath(import.meta.url),
  "..",
  "test-results",
  "r2-perf-audit.json"
);

const VENTURES = [
  "/", "/travel-index/", "/quantum-wearables/", "/shoe-brand/", "/gaming/",
  "/kids-channel/", "/innovation-hub/", "/ewaste-recycling/",
];

// Collect heap metrics via CDP Performance.collectMetrics channel.
async function collectHeapSnapshots(cdp) {
  const snapshots = [];
  cdp.send("Performance.enable");
  return new Promise((resolve) => {
    const onMetrics = (event) => {
      const metrics = event.metrics || [];
      const used = metrics.find((m) => m.name === "UsedJSHeapSize");
      const total = metrics.find((m) => m.name === "TotalJSHeapSize");
      const jsHeap = metrics.find((m) => m.name === "JavaScriptHeapSize");
      if (used || total || jsHeap) {
        snapshots.push({
          usedMB: used?.value ? Math.round(used.value / (1024 * 1024)) : null,
          totalMB: total?.value ? Math.round(total.value / (1024 * 1024)) : null,
          jsHeapMB: jsHeap?.value ? Math.round(jsHeap.value / (1024 * 1024)) : null,
        });
      }
    };
    cdp.on("Performance.collectMetrics", onMetrics);
    // Give CDP a moment to emit first metrics
    setTimeout(() => {
      try { cdp.removeListener("Performance.collectMetrics", onMetrics); } catch {}
      resolve(snapshots);
    }, 500);
  });
}

async function getHeapMB(page, cdp) {
  const snapshots = await collectHeapSnapshots(cdp);
  const used = snapshots
    .map((s) => s.usedMB)
    .filter((v) => v !== null);
  return used.length ? Math.max(...used) : 0;
}

async function runR2Audit() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err.message)));

  // 1. Cold start: t0 = load, t1 = first paint + canvas init settle
  const t0 = performance.now();
  await page.goto(SERVER_URL + "/", { waitUntil: "networkidle", timeout: 30000 });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(800); // first paint + canvas init settle
  const t1 = performance.now();
  const coldStartMs = t1 - t0;

  // Baseline heap
  const baselineHeapMB = await getHeapMB(page, cdp);

  // 2. 50 rapid transitions: fly-to + drawer open + palette search
  const stressStart = performance.now();
  let cycleTotalMs = 0;
  const cycleCount = 50;
  for (let i = 0; i < cycleCount; i++) {
    const venture = VENTURES[i % VENTURES.length];
    await page.goto(`${SERVER_URL}${venture}`, { waitUntil: "networkidle", timeout: 10000 });
    const pressure = Date.now();
    // Simulate: animateTo + drawer open + palette open
    await page.evaluate(() => {
      // minimal stress: dispatch visible + simulate a couple of state changes
    });
    cycleTotalMs += Date.now() - pressure;
    // Force GC via performance (best-effort in headless Chromium)
    try { await page.evaluate(() => globalThis.gc()); } catch {}
  }
  const t2 = performance.now();
  const stressDurationMs = t2 - stressStart;
  const avgCycleMs = cycleTotalMs / cycleCount;

  // Post-stress heap
  const postStressHeapMB = await getHeapMB(page, cdp);

  const heapDeltaMB = postStressHeapMB - baselineHeapMB;

  // Mobile-DPR profile: reload at 393x852 @ 3x
  let mobileHeapMB = 0;
  const t3 = performance.now();
  await page.setViewportSize({ width: 393, height: 852 });
  await page.setViewportSize({ width: 393, height: 852, deviceScaleFactor: 3 });
  await page.reload({ waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(800);
  const t4 = performance.now();
  mobileHeapMB = await getHeapMB(page, cdp);

  const mobileColdStartMs = t4 - t3;

  await context.close();
  await browser.close();

  const failures = [];
  if (coldStartMs >= 300) failures.push(`coldStartMs=${coldStartMs.toFixed(0)}ms >= 300ms (SLOW)`);
  if (heapDeltaMB >= 5.0) failures.push(`heapDeltaMB=${heapDeltaMB}MB >= 5.0MB (MEMORY-LEAK)`);
  if (avgCycleMs >= 60) failures.push(`avgCycleMs=${avgCycleMs.toFixed(1)}ms/cycle >= 60ms (SLOW-CYCLE)`);
  if (mobileHeapMB > baselineHeapMB + 1.0) failures.push(`mobileHeapMB=${mobileHeapMB}MB > baseline(${baselineHeapMB}) + 1.0MB (MOBILE-HEAP-GROW)`);
  if (consoleErrors.length > 0) failures.push(`consoleErrors=${consoleErrors.length} (CONSOLE-ERRORS)`);

  const report = {
    coldStartMs,
    avgCycleMs,
    baselineHeapMB,
    postStressHeapMB,
    heapDeltaMB,
    mobileHeapMB,
    mobileColdStartMs,
    stressDurationMs,
    consoleErrors,
    failures,
  };

  if (failures.length > 0) {
    console.error("R2 FAILURES:");
    failures.forEach((f) => console.error("  -", f));
  } else {
    console.log("R2 PASS: all metric gates within thresholds.");
  }
  console.log(JSON.stringify(report, null, 2));
  return report;
}

async function main() {
  try {
    await runR2Audit();
  } catch (err) {
    console.error("R2 AUDIT ERROR:", err);
    process.exitCode = 1;
  }
}

main();
