#!/usr/bin/env python3
"""
Check health of all Umbrella Corporation integrated services.
Usage: python3 check_all_services.py
"""
import urllib.request
import urllib.error
import json
import sys
import os
from datetime import datetime

SERVICES = [
    {"name": "OpenClaw Gateway", "url": "http://127.0.0.1:18789/health", "port": 18789},
    {"name": "Ollama (Direct)", "url": "http://127.0.0.1:11434/api/tags", "port": 11434},
    {"name": "Ollama Proxy", "url": "http://127.0.0.1:8002/health", "port": 8002},
    {"name": "Agent Zero API", "url": "http://127.0.0.1:8001/health", "port": 8001},
    {"name": "Bolt.DIY", "url": "http://127.0.0.1:5173", "port": 5173},
    {"name": "Umbrella Web", "url": "http://127.0.0.1:3000", "port": 3000},
    {"name": "n8n", "url": "http://127.0.0.1:5678/healthz", "port": 5678},
    {"name": "Aura Backend", "url": "http://127.0.0.1:3100/health", "port": 3100},
    {"name": "Aura Anti-Cheat", "url": "http://127.0.0.1:3101/health", "port": 3101},
    {"name": "Aura Trinity", "url": "http://127.0.0.1:3102/health", "port": 3102},
    {"name": "Aura Tournament", "url": "http://127.0.0.1:3103/health", "port": 3103},
    {"name": "Aura NFC Handler", "url": "http://127.0.0.1:3104/health", "port": 3104},
    {"name": "PostgreSQL (Aura DB)", "url": None, "port": 5432},
]

def check_service(svc):
    """Check if a service is reachable."""
    if svc["url"] is None:
        # Try TCP connection for non-HTTP services
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        try:
            result = sock.connect_ex(("127.0.0.1", svc["port"]))
            sock.close()
            return result == 0, "reachable" if result == 0 else "down"
        except Exception:
            return False, "error"
    
    try:
        req = urllib.request.Request(svc["url"], method="GET")
        req.add_header("User-Agent", "Umbrella-Corp-Health/1.0")
        resp = urllib.request.urlopen(req, timeout=5)
        return True, f"HTTP {resp.status}"
    except urllib.error.HTTPError as e:
        # HTTP error means the service IS running, just returned an error code
        return True, f"HTTP {e.code}"
    except urllib.error.URLError as e:
        return False, str(e.reason)
    except Exception as e:
        return False, str(e)

def main():
    print(f"\n{'='*60}")
    print(f"  Umbrella Corporation - Service Health Check")
    print(f"  Timestamp: {datetime.now().isoformat()}")
    print(f"{'='*60}\n")
    
    all_healthy = True
    results = []
    
    for svc in SERVICES:
        ok, detail = check_service(svc)
        status = "✓ UP" if ok else "✗ DOWN"
        if not ok:
            all_healthy = False
        print(f"  {status:8}  {svc['name']:25}  :{svc['port']}  {detail}")
        results.append({
            "name": svc["name"],
            "port": svc["port"],
            "status": "up" if ok else "down",
            "detail": detail
        })
    
    print(f"\n{'='*60}")
    if all_healthy:
        print(f"  All {len(SERVICES)} services are UP")
    else:
        down = sum(1 for r in results if r["status"] == "down")
        print(f"  {down}/{len(SERVICES)} services are DOWN")
    print(f"{'='*60}\n")
    
    # Output JSON report
    report = {
        "timestamp": datetime.now().isoformat(),
        "total_services": len(SERVICES),
        "all_healthy": all_healthy,
        "services": results
    }
    
    report_path = os.path.join(os.path.dirname(__file__), "..", "reports", "service_health.json")
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"  Report saved to: {os.path.abspath(report_path)}")
    print(f"  Dashboard:       file://{os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dashboard.html'))}")
    print()
    
    return 0 if all_healthy else 1

if __name__ == "__main__":
    sys.exit(main())
