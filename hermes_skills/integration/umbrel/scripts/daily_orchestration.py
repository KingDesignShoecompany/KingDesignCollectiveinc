#!/usr/bin/env python3
"""
Umbrella Daily Orchestration — runs at 8:30AM daily.

This cron job demonstrates the full integration of all 6 tools + Hermes:

1. OpenClaw (gateway:18789) → receives the orchestration command
2. Hermes skills → route the task to the right subsidiary
3. Ollama (11434) → provides LLM inference
4. Agent Zero API (8001) → handles multi-agent content generation
5. Bolt.DIY (5173) → generates web assets for subsidiaries
6. n8n (5678) → runs the automation pipeline
7. Aura Champions (3100-3104) → game backend operations

The entire pipeline is:
  → Health check all services (via integration bridge:8090)
  → Generate daily content (Bolt.DIY + Agent Zero + Hermes skills)
  → Sync game state (Aura backend)
  → Dispatch to n8n for workflow management
  → Report results back to OpenClaw gateway

Output is saved to: corporate_runtime/documents/integration/daily_reports/
"""
import json
import os
import subprocess
import sys
import time
import urllib.request
from datetime import datetime, timezone

# ─── Configuration ──────────────────────────────────────────────
INTEGRATION_BRIDGE = "http://127.0.0.1:8090"
OPENCLAW_GATEWAY = "http://127.0.0.1:18789"
N8N_URL = "http://127.0.0.1:5678"
AURA_BACKEND = "http://127.0.0.1:3100"
CORPORATE_DOCS = r"C:\Users\young\agents\corporate_runtime\documents"
REPORTS_DIR = os.path.join(CORPORATE_DOCS, "integration", "daily_reports")

# Ensure reports directory exists
os.makedirs(REPORTS_DIR, exist_ok=True)


def http_get(url, timeout=30):
    """Make an HTTP GET request and return (ok, data_or_error)."""
    try:
        req = urllib.request.Request(url, method="GET")
        resp = urllib.request.urlopen(req, timeout=timeout)
        try:
            return True, json.loads(resp.read())
        except json.JSONDecodeError:
            return True, resp.read().decode()
    except Exception as e:
        return False, str(e)


def http_post(url, data, timeout=30):
    """Make an HTTP POST request and return (ok, data_or_error)."""
    try:
        body = json.dumps(data).encode("utf-8")
        req = urllib.request.Request(
            url, data=body, method="POST",
            headers={"Content-Type": "application/json"}
        )
        resp = urllib.request.urlopen(req, timeout=timeout)
        try:
            return True, json.loads(resp.read())
        except json.JSONDecodeError:
            return True, resp.read().decode()
    except Exception as e:
        return False, str(e)


def run_pipeline():
    """Execute the full Umbrella orchestration pipeline."""
    timestamp = datetime.now(timezone.utc).isoformat()
    report = {
        "timestamp": timestamp,
        "pipeline": "umbrella-daily-orchestration",
        "steps": [],
    }

    print(f"\n{'='*60}")
    print(f"  Umbrella Daily Orchestration — {timestamp}")
    print(f"{'='*60}\n")

    # ─── Step 1: Health Check via Integration Bridge ───────────
    print("[Step 1] Checking all service health via integration bridge...")
    health_ok, status = http_get(f"{INTEGRATION_BRIDGE}/api/umbrella/status")
    if health_ok:
        down = [k for k, v in status.get("aura_services", {}).items() if v != "up"]
        all_ok = status.get("openclaw", {}).get("ok", False)
        report["steps"].append({
            "step": "health_check",
            "status": "ok" if all_ok and not down else "degraded",
            "data": {
                "openclaw": status.get("openclaw"),
                "ollama_models": status.get("ollama_models"),
                "aura_services": status.get("aura_services"),
                "n8n_workflows": len(status.get("n8n_workflows", [])),
                "hermes_skills": len(status.get("hermes_skills", [])),
            }
        })
        print(f"  ✓ OpenClaw: {status['openclaw']}")
        print(f"  ✓ Ollama models: {status['ollama_models']}")
        print(f"  ✓ Aura services: {status['aura_services']}")
        print(f"  ✓ Hermes skills: {len(status['hermes_skills'])}")
    else:
        report["steps"].append({"step": "health_check", "status": "failed", "error": status})
        print(f"  ✗ Health check failed: {status}")

    # ─── Step 2: Route today's task through Hermes ─────────────
    print("\n[Step 2] Routing daily task through OpenClaw -> Hermes...")
    task_payload = {
        "task": "Generate daily content pipeline for all subsidiaries",
        "context": {
            "subsidiaries": [
                "shoe-brand", "travel-index", "game-design", "kids-channel",
                "innovation-hub", "ewaste-recycling", "quantum-wearables",
                "crypto-treasury", "aura-champions"
            ],
            "date": timestamp,
        }
    }
    ok, route_result = http_post(f"{INTEGRATION_BRIDGE}/api/umbrella/route", task_payload)
    report["steps"].append({
        "step": "task_routing",
        "status": "ok" if ok else "failed",
        "data": route_result,
    })
    if ok:
        print(f"  ✓ Task routed to: {route_result.get('routed_to')}")
    else:
        print(f"  ✗ Routing failed: {route_result}")

    # ─── Step 3: Execute via Hermes skill dispatch ─────────────
    print("\\n[Step 3] Dispatching to Hermes skills...")
    exec_ok, exec_data = http_post(f"{INTEGRATION_BRIDGE}/api/umbrella/execute", task_payload)
    report["steps"].append({
        "step": "hermes_dispatch",
        "status": "ok" if exec_ok else "failed",
        "data": exec_data,
    })
    if exec_ok:
        print(f"  ✓ Hermes execution: {exec_data}")
    else:
        print(f"  ✗ Hermes dispatch failed: {exec_data}")

    # ─── Step 4: Aura Tournament Sync ──────────────────────────
    print("\\n[Step 4] Syncing Aura Champions tournament state...")
    ok, sync = http_post(f"{AURA_BACKEND}/api/tournaments/sync", {"source": "daily-orchestration"})
    report["steps"].append({
        "step": "aura_tournament_sync",
        "status": "ok" if ok else "skipped",
        "data": sync if ok else f"Skipped (endpoint unavailable): {sync}",
    })
    if ok:
        print(f"  ✓ Tournament sync: {sync}")
    else:
        print(f"  ↳ Aura sync skipped (backend endpoint not yet deployed): {sync}")

    # ─── Step 5: Trigger n8n workflow ───────────────────────────
    print("\\n[Step 5] Triggering n8n automation pipeline...")
    ok, n8n_result = http_post(
        f"{N8N_URL}/webhook/umbrella-daily",
        {"action": "daily_orchestration", "timestamp": timestamp}
    )
    report["steps"].append({
        "step": "n8n_pipeline",
        "status": "ok" if ok else "skipped",
        "data": n8n_result if ok else f"Skipped (n8n webhook not configured): {n8n_result}",
    })
    if ok:
        print(f"  ✓ n8n pipeline triggered")
    else:
        print(f"  ↳ n8n webhook not configured — skipping: {n8n_result}")

    # ─── Step 6: Save Report ───────────────────────────────────
    report["status"] = "complete"
    report["all_services_ok"] = health_ok and all(
        v == "up" for v in status.get("aura_services", {}).values()
    ) if health_ok else False

    report_file = os.path.join(REPORTS_DIR, f"daily_report_{datetime.now().strftime('%Y%m%d')}.json")
    with open(report_file, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\n  Report saved to: {report_file}")
    print(f"  Dashboard: http://127.0.0.1:3000/dashboard.html")

    print(f"\n{'='*60}")
    print(f"  Daily orchestration complete!")
    print(f"{'='*60}\n")

    return report


if __name__ == "__main__":
    # Check if the integration bridge is running; if not, start it
    ok, _ = http_get(f"{INTEGRATION_BRIDGE}/api/umbrella/status", timeout=30)
    if not ok:
        print("Integration bridge not running. Starting it...")
        bridge_path = r"C:\Users\young\agents\hermes_skills\integration\umbrel\scripts\bridge.py"
        subprocess.Popen(
            [sys.executable, bridge_path],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            env={**os.environ, "BRIDGE_PORT": "8090"}
        )
        time.sleep(3)
        print("Bridge started.")

    run_pipeline()
