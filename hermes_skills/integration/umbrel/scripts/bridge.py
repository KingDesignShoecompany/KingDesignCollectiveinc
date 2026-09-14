#!/usr/bin/env python3
"""
OpenClaw <-> Hermes Bridge API.
This script runs as a sidecar to the OpenClaw gateway, providing
HTTP endpoints that OpenClaw can call to dispatch tasks to Hermes skills.

Endpoints:
  POST /api/hermes/run     - Execute a Hermes skill with a task
  POST /api/hermes/task    - Dispatch a task to a Hermes skill (async)
  GET  /api/hermes/skills  - List available Hermes skills
  GET  /api/hermes/status  - Check Hermes runtime status
"""
import json
import os
import subprocess
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone

# Configuration
HERMES_SKILLS_DIR = os.environ.get(
    "HERMES_SKILLS_DIR",
    r"C:\Users\young\AppData\Local\hermes\skills"
)
HERMES_ENDPOINT = os.environ.get("HERMES_ENDPOINT", "http://127.0.0.1:18789")
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
N8N_URL = os.environ.get("N8N_URL", "http://127.0.0.1:5678")
BOLT_URL = os.environ.get("BOLT_URL", "http://127.0.0.1:5173")
AGENT_ZERO_API = os.environ.get("AGENT_ZERO_API", "http://127.0.0.1:8001")
AURA_BACKEND = os.environ.get("AURA_BACKEND", "http://127.0.0.1:3100")
CORPORATE_DOCS = os.environ.get(
    "CORPORATE_DOCS",
    r"C:\Users\young\agents\corporate_runtime\documents"
)

# Subsidiary routing table
SUBSIDIARIES = {
    "shoe-brand": {"sector": "Consumer", "keywords": ["inventory", "ad copy", "product", "ecommerce", "shoe", "sneaker", "footwear", "collection", "SKUs", "product images", "marketing", "brand"]},
    "travel-index": {"sector": "Digital Media", "keywords": ["travel", "country", "TikTok", "currency", "guide", "geospatial", "destination", "itinerary", "vagary"]},
    "game-design": {"sector": "Virtual", "keywords": ["Unreal", "mechanics", "C++", "level", "UE5", "Unity", "blueprint", "Trinity VFX", "card-battler", "battler", "game design", "game-design", "content pipeline", "pipeline"]},
    "kids-channel": {"sector": "Media", "keywords": ["bedtime", "story", "TTS", "narration", "child", "bedtime story", "sleep", "kids"]},
    "innovation-hub": {"sector": "Deep Tech", "keywords": ["patent", "white paper", "tech stack", "IP", "intellectual property", "research", "innovation"]},
    "ewaste-recycling": {"sector": "Industrial Eco", "keywords": ["e-waste", "gold", "copper", "palladium", "recycling", "rare earth", "silver", "scrap"]},
    "quantum-wearables": {"sector": "Deep Tech", "keywords": ["cold fission", "thermal", "wearable", "physics", "quantum", "biometric", "sensor"]},
    "crypto-treasury": {"sector": "Financial", "keywords": ["token", "ATM", "ledger", "settlement", "payload", "treasury", "blockchain", "crypto", "tokenomics", "wallet", "staking"]},
    "aura-champions": {"sector": "Gaming", "keywords": ["card-battler", "AR", "NFC", "battle", "tournament", "trinity", "convergence", "champions", "monster", "deck", "sideboard"]},
}

def route_to_subsidiary(task_description):
    """Route a task to the appropriate subsidiary based on keywords."""
    task_lower = task_description.lower()
    for skill, info in SUBSIDIARIES.items():
        for keyword in info["keywords"]:
            if keyword in task_lower:
                return skill, info
    return "general", {"sector": "General", "keywords": []}


def get_ollama_models():
    """Get list of available Ollama models."""
    try:
        req = urllib.request.Request(f"{OLLAMA_URL}/api/tags", method="GET")
        resp = urllib.request.urlopen(req, timeout=5)
        data = json.loads(resp.read())
        return [m["name"] for m in data.get("models", [])]
    except Exception:
        return []


def get_n8n_workflows():
    """Get list of n8n workflows."""
    try:
        req = urllib.request.Request(f"{N8N_URL}/api/v1/workflows", method="GET")
        resp = urllib.request.urlopen(req, timeout=5)
        data = json.loads(resp.read())
        return [w["name"] for w in data.get("data", [])]
    except Exception:
        return []


def get_aura_status():
    """Check Aura Champions service health."""
    services = {
        "backend": f"{AURA_BACKEND}/health",
        "anti-cheat": "http://127.0.0.1:3101/health",
        "trinity": "http://127.0.0.1:3102/health",
        "tournament": "http://127.0.0.1:3103/health",
        "nfc": "http://127.0.0.1:3104/health",
    }
    results = {}
    for name, url in services.items():
        try:
            req = urllib.request.Request(url, method="GET")
            resp = urllib.request.urlopen(req, timeout=3)
            results[name] = "up"
        except Exception:
            results[name] = "down"
    return results


def get_openclaw_status():
    """Check OpenClaw gateway status."""
    try:
        req = urllib.request.Request(f"{HERMES_ENDPOINT}/health", method="GET")
        resp = urllib.request.urlopen(req, timeout=5)
        data = json.loads(resp.read())
        return data
    except Exception:
        return {"ok": False, "status": "down"}


def dispatch_to_hermes(skill, task, context=None):
    """
    Dispatch a task to Hermes via the OpenClaw gateway.
    This simulates calling a Hermes skill with a task.
    In production, this would use the Hermes MCP protocol.
    """
    # Build the task payload
    payload = {
        "skill": skill,
        "task": task,
        "context": context or {},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    # Try OpenClaw's Hermes integration endpoint
    try:
        body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            f"{HERMES_ENDPOINT}/api/hermes/run",
            data=body,
            method="POST",
            headers={"Content-Type": "application/json"}
        )
        resp = urllib.request.urlopen(req, timeout=30)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        # Endpoint not available, fall back to direct skill execution
        return {"error": f"HTTP {e.code}", "fallback": True, "payload": payload}
    except Exception as e:
        return {"error": str(e), "fallback": True, "payload": payload}


def list_hermes_skills():
    """List available Hermes skills from the skills directory."""
    skills = []
    if os.path.isdir(HERMES_SKILLS_DIR):
        for root, dirs, files in os.walk(HERMES_SKILLS_DIR):
            if "SKILL.md" in files:
                rel = os.path.relpath(root, HERMES_SKILLS_DIR)
                skills.append(rel.replace("\\", "/").replace("/", " / ").strip())
    return sorted(skills)


def get_full_stack_status():
    """Get comprehensive status of all Umbrella stack services."""
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "openclaw": get_openclaw_status(),
        "ollama_models": get_ollama_models(),
        "n8n_workflows": get_n8n_workflows(),
        "aura_services": get_aura_status(),
        "hermes_skills": list_hermes_skills(),
        "subsidiaries": {k: v["sector"] for k, v in SUBSIDIARIES.items()},
        "endpoints": {
            "openclaw_gateway": HERMES_ENDPOINT,
            "ollama": OLLAMA_URL,
            "agent_api": AGENT_ZERO_API,
            "bolt_diyc": BOLT_URL,
            "n8n": N8N_URL,
            "aura_backend": AURA_BACKEND,
        },
    }


def handle_request(method, path, body=None):
    """Simple request router."""
    if method == "GET" and path == "/api/umbrella/status":
        return 200, get_full_stack_status()

    elif method == "GET" and path == "/api/umbrella/skills":
        return 200, {"skills": list_hermes_skills()}

    elif method == "POST" and path == "/api/umbrella/route":
        task = body.get("task", "")
        skill, info = route_to_subsidiary(task)
        return 200, {
            "task": task,
            "routed_to": skill,
            "sector": info["sector"],
            "matched_keywords": [k for k in info["keywords"] if k in task.lower()],
        }

    elif method == "POST" and path == "/api/umbrella/execute":
        task = body.get("task", "")
        skill, info = route_to_subsidiary(task)
        result = dispatch_to_hermes(skill, task, body.get("context"))
        return 200, {"routed_to": skill, "result": result}

    elif method == "POST" and path == "/api/umbrella/n8n-trigger":
        # Trigger an n8n workflow via webhook
        workflow = body.get("workflow", "")
        webhook_url = f"{N8N_URL}/webhook/{workflow}"
        try:
            payload = json.dumps(body.get("data", {})).encode("utf-8")
            req = urllib.request.Request(
                webhook_url,
                data=payload,
                method="POST",
                headers={"Content-Type": "application/json"}
            )
            resp = urllib.request.urlopen(req, timeout=10)
            return 200, {"triggered": workflow, "status_code": resp.status}
        except Exception as e:
            return 502, {"error": str(e), "workflow": workflow}

    elif method == "GET" and path == "/api/umbrella/dashboard":
        # Return the dashboard HTML
        dashboard_path = os.path.join(
            os.path.dirname(__file__), "..", "dashboard.html"
        )
        if os.path.exists(dashboard_path):
            with open(dashboard_path, "r") as f:
                return 200, f.read(), "text/html"
        return 404, {"error": "Dashboard not found"}

    return 404, {"error": "Not found", "path": path, "method": method}


# ─── Simple HTTP Server ─────────────────────────────────────────
from http.server import HTTPServer, BaseHTTPRequestHandler


class UmbrellaBridgeHandler(BaseHTTPRequestHandler):
    """HTTP handler for the Umbrella integration bridge."""

    def do_GET(self):
        self.handle_request("GET")

    def do_POST(self):
        self.handle_request("POST")

    def do_PUT(self):
        self.handle_request("PUT")

    def do_DELETE(self):
        self.handle_request("DELETE")

    def handle_request(self, method):
        body = None
        if method in ("POST", "PUT"):
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length > 0:
                raw = self.rfile.read(content_length)
                try:
                    body = json.loads(raw)
                except json.JSONDecodeError:
                    body = {"raw": raw.decode("utf-8", errors="replace")}

        try:
            status, result, *extra = handle_request(method, self.path, body)
            content_type = extra[0] if extra else "application/json"
        except Exception as e:
            status = 500
            result = {"error": str(e)}
            content_type = "application/json"

        if isinstance(result, (dict, list)):
            response = json.dumps(result).encode("utf-8")
        elif isinstance(result, str):
            response = result.encode("utf-8")
        else:
            response = json.dumps({"result": result}).encode("utf-8")

        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", len(response))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(response)

    def log_message(self, format, *args):
        sys.stderr.write(f"[{datetime.now().strftime('%H:%M:%S')}] {format % args}\n")


def main():
    port = int(os.environ.get("BRIDGE_PORT", "8090"))
    server = HTTPServer(("127.0.0.1", port), UmbrellaBridgeHandler)
    print(f"Umbrella Integration Bridge listening on http://127.0.0.1:{port}")
    print(f"OpenClaw Gateway: {HERMES_ENDPOINT}")
    print(f"Ollama: {OLLAMA_URL}")
    print(f"Agent Zero API: {AGENT_ZERO_API}")
    print(f"Bolt.DIY: {BOLT_URL}")
    print(f"n8n: {N8N_URL}")
    print(f"Aura Backend: {AURA_BACKEND}")
    print(f"\nEndpoints:")
    print(f"  GET  /api/umbrella/status     - Full stack health check")
    print(f"  GET  /api/umbrella/skills     - List Hermes skills")
    print(f"  POST /api/umbrella/route       - Route a task to a subsidiary")
    print(f"  POST /api/umbrella/execute     - Execute a task via Hermes")
    print(f"  POST /api/umbrella/n8n-trigger - Trigger an n8n workflow")
    print(f"  GET  /api/umbrella/dashboard   - Integration dashboard HTML")
    server.serve_forever()


if __name__ == "__main__":
    main()
