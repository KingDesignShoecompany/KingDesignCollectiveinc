// scripts/r2-perf-audit.spec.mjs
// Ad-hoc R2 performance & memory audit (observational, no code change).
// Runs scripts/r2-perf-audit.mjs as a Playwright test.

import { test } from "@playwright/test";
import { spawnSync } from "node:child_process";

test("R2: performance & memory stress audit", async () => {
  const result = spawnSync("node", ["./scripts/r2-perf-audit.mjs"], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });
  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  const exitCode = result.status || result.signal;

  // Print captured metrics to Playwright reporter
  const metricLines = stdout.split("\n").filter((l) =>
    l.startsWith("{") || l.startsWith("}") ||
    l.includes("coldStartMs") || l.includes("baselineHeapMB")
  );
  for (const line of metricLines) {
    if (line.trim()) console.log(`[R2] ${line.trim()}`);
  }

  if (stderr.trim()) {
    console.warn(`[R2 STDERR] ${stderr.trim()}`);
  }

  if (exitCode === 0) {
    console.log("[R2] PASS: all metric gates within thresholds.");
  } else {
    console.error(`[R2] FAILED (exit ${exitCode})`);
    throw new Error(`R2 performance audit failed (exit ${exitCode})`);
  }
});
