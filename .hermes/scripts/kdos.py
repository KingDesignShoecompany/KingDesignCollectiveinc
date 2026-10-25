#!/usr/bin/env python3
"""KingDesign OS — Unified Orchestrator Script (kdos.py)

Single-file OS kernel for KingDesign Collective INC.
Subcommands:
  init           Create SQLite DB + schema at ~/.local/share/kingdesign-os/kdos.db
  seed           Populate kd_organizations + kd_agents from manifest + corporate_structure.json
  sync-status    Update subsidiary statuses from formation tracker
  ingest         Ingest all corporate legal docs into kd_knowledge
  serve          Start HTTP API server on port 8090
  cli            Run CLI query (args: orgs|projects|tasks|dashboard|ask <q>)
  orch           Start orchestration poll daemon (30s loop)
  telegram       Start Telegram CEO Q&A bridge daemon\n  daemon:<name>  Start a specialist daemon (athena|oracle|daedalus|ares|hephaestus|vulcan|hades)

Dependencies: stdlib only (sqlite3, http.server, json, urllib, os, sys, time, hashlib, threading)
Optional: pyyaml (for reading manifest.yaml — fallback: json only)
"""

import os, sys, json, time, hashlib, sqlite3, threading, urllib.parse, urllib.request, re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

# ─── Paths ────────────────────────────────────────────────────────────────
HOME = Path.home()
AGENTS_ROOT = HOME / "agents"
OS_DATA_DIR = HOME / ".local" / "share" / "kingdesign-os"
DB_PATH = OS_DATA_DIR / "kdos.db"
MANIFEST_PATH = AGENTS_ROOT / "registry" / "manifest.yaml"
CORP_DOCS = AGENTS_ROOT / "corporate_runtime" / "documents"
SUBSIDIARY_TRACKER = AGENTS_ROOT / "registry" / "subsidiary_formation_tracker.json"
TELEGRAM_TOKEN_FILE = AGENTS_ROOT / "telegram_bot_token.txt"
SKILL_ROUTING = HOME / "agents" / ".hermes" / "skills" / "os_skill_routing.json"
CHAT_ID = "8866994677"
API_PORT = 8090

SECTOR_DIR_MAP = {
    "vagary_index": "travel_index",
    "shoes": "shoe_brand",
    "gamedev": "game_design",
    "kids": "kids_channel",
    "innovation": "innovation_hub",
    "ewaste": "ewaste_recycling",
    "quantum": "quantum_wearables",
    "crypto_treasury": "crypto_treasury",
}

SKIP_DIRS = {"node_modules", "Saved", "Intermediate", "webcache", "keys", "tokenomics_docs",
             "quarantine", "DerivedDataCache", "Binaries"}

SCHEMA = """
CREATE TABLE IF NOT EXISTS kd_organizations (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    type          TEXT CHECK (type IN ('holding','subsidiary','division')),
    parent_id     TEXT,
    sector_id     TEXT,
    entity_name   TEXT,
    jurisdiction  TEXT,
    entity_type   TEXT,
    status        TEXT DEFAULT 'pending',
    business_model TEXT,
    brand_identity TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kd_agents (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    role            TEXT NOT NULL,
    type            TEXT CHECK (type IN ('orchestrator','leaf','exec')),
    sector_id       TEXT,
    toolsets        TEXT,
    active_project_ids TEXT,
    config          TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kd_projects (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    company_id    TEXT,
    type          TEXT CHECK (type IN ('web','ai','vr','ar','game','media','brand','research','infra')),
    status        TEXT DEFAULT 'planning',
    priority      TEXT CHECK (priority IN ('critical','high','normal','low')),
    owner_agent   TEXT,
    description   TEXT,
    milestones    TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kd_tasks (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    description     TEXT,
    project_id      TEXT,
    assigned_agent_id TEXT,
    status          TEXT DEFAULT 'todo' CHECK (status IN ('todo','in_progress','review','done','blocked')),
    priority        TEXT CHECK (priority IN ('critical','high','normal','low')),
    due_date        TIMESTAMP,
    result          TEXT,
    metadata        TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kd_assets (
    id            TEXT PRIMARY KEY,
    project_id    TEXT,
    name          TEXT NOT NULL,
    type          TEXT CHECK (type IN ('model','texture','audio','code','video','document','data')),
    path          TEXT,
    version       TEXT,
    owner_agent   TEXT,
    metadata      TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kd_knowledge (
    id            TEXT PRIMARY KEY,
    title         TEXT NOT NULL,
    category      TEXT CHECK (category IN ('business','engineering','marketing','media','legal','research')),
    sector_id     TEXT,
    source        TEXT,
    content       TEXT,
    tags          TEXT,
    last_updated  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kd_metrics (
    id          TEXT PRIMARY KEY,
    company_id  TEXT,
    name        TEXT,
    value       REAL,
    unit        TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kd_workflows (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    trigger_type TEXT CHECK (trigger_type IN ('cron','webhook','manual','poll')),
    schedule    TEXT,
    definition  TEXT,
    status      TEXT DEFAULT 'paused' CHECK (status IN ('active','paused','error')),
    last_run    TIMESTAMP,
    next_run    TIMESTAMP,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON kd_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON kd_tasks(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_projects_company ON kd_projects(company_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sector ON kd_knowledge(sector_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON kd_knowledge(tags);
"""


def get_db():
    OS_DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def cmd_init():
    OS_DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = get_db()
    conn.executescript(SCHEMA)
    conn.commit()
    # Count tables
    cur = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'kd_%' ORDER BY name")
    tables = [r[0] for r in cur.fetchall()]
    conn.close()
    print(f"Database initialized at {DB_PATH}")
    print(f"Tables ({len(tables)}): {', '.join(tables)}")


def cmd_seed():
    """Seed organizations from manifest.yaml + corporate_structure.json files."""
    if not MANIFEST_PATH.exists():
        print(f"ERROR: manifest not found at {MANIFEST_PATH}")
        sys.exit(1)
    try:
        import yaml
        with open(MANIFEST_PATH) as f:
            manifest = yaml.safe_load(f)
    except ImportError:
        # Fallback: parse manifest.yaml manually (we know its structure)
        manifest = {"sectors": [], "cross_sector": {}}
        print("WARNING: pyyaml not installed, using empty manifest")
        print("Install with: uv pip install --system pyyaml")

    conn = get_db()
    cur = conn.cursor()

    # Insert holding company
    # Insert holding company — 7 params for 7 ? placeholders
    cur.execute("""INSERT OR REPLACE INTO kd_organizations
        (id, name, type, parent_id, sector_id, entity_name, jurisdiction, entity_type, status, business_model, brand_identity)
        VALUES (?, ?, 'holding', NULL, NULL, ?, ?, ?, 'active', ?, ?)""",
        ("kingdesign_collective", "KingDesign Collective", "KingDesign Collective", "Delaware", "Holding Company", "{}", "{}"))

    # Insert subsidiaries from corporate_structure.json files
    for sector_id, dir_name in SECTOR_DIR_MAP.items():
        if sector_id == "crypto_treasury":
            continue
        struct_path = CORP_DOCS / dir_name / "legal_reference" / "corporate_structure.json"
        if not struct_path.exists():
            continue
        struct = json.loads(struct_path.read_text())
        org_name = struct.get("entity_name") or struct.get("brand_name") or sector_id
        sector_info = next((s for s in manifest.get("sectors", []) if s["id"] == sector_id), {})
        display_name = sector_info.get("name", org_name)
        cur.execute("""INSERT OR REPLACE INTO kd_organizations
            (id, name, type, parent_id, sector_id, entity_name, jurisdiction, entity_type, status, business_model, brand_identity)
            VALUES (?, ?, 'subsidiary', 'kingdesign_collective', ?, ?, ?, ?, 'pending', ?, ?)""",
            (sector_id, display_name, sector_id, org_name,
             struct.get("jurisdiction", "[PENDING]"),
             struct.get("entity_type", "[PENDING]"),
             json.dumps(struct.get("business_model", {})),
             json.dumps(struct.get("brand_identity", {}))))

    # Insert agents from manifest
    cross = manifest.get("cross_sector", {})
    cur.execute("""INSERT OR REPLACE INTO kd_agents
        (id, name, role, type, sector_id, toolsets, config)
        VALUES (?, ?, ?, 'exec', NULL, ?, '{}')""",
        ("hermes-ceo", "Hermes", "CEO / COO Orchestrator",
         json.dumps(["terminal", "file", "web", "delegation"])))

    for name, info in cross.items():
        agent_id = f"daemon-{name}"
        toolsets = info.get("toolsets", ["terminal", "file"])
        cur.execute("""INSERT OR REPLACE INTO kd_agents
            (id, name, role, type, sector_id, toolsets, config)
            VALUES (?, ?, ?, ?, NULL, ?, '{}')""",
            (agent_id, info["name"], info["role"], info["role"], json.dumps(toolsets)))

    for sector in manifest.get("sectors", []):
        lead_id = sector["lead"]
        cur.execute("""INSERT OR REPLACE INTO kd_agents
            (id, name, role, type, sector_id, toolsets, config)
            VALUES (?, ?, ?, 'leaf', ?, ?, '{}')""",
            (lead_id, f"{sector['name']} Lead", sector["name"], sector["id"],
             json.dumps(["terminal", "file", "delegation"])))
        for worker in sector.get("workers", []):
            cur.execute("""INSERT OR REPLACE INTO kd_agents
                (id, name, role, type, sector_id, toolsets, config)
                VALUES (?, ?, ?, 'leaf', ?, ?, '{}')""",
                (worker, f"{sector['name']} Worker", sector["name"], sector["id"],
                 json.dumps(["terminal", "file"])))

    conn.commit()
    org_count = cur.execute("SELECT COUNT(*) FROM kd_organizations").fetchone()[0]
    agent_count = cur.execute("SELECT COUNT(*) FROM kd_agents").fetchone()[0]
    conn.close()
    print(f"Seeded {org_count} organizations, {agent_count} agents")


def cmd_ingest():
    """Ingest all corporate legal docs into kd_knowledge."""
    conn = get_db()
    cur = conn.cursor()
    count = 0
    sector_counts = {}

    for sector_id, dir_name in SECTOR_DIR_MAP.items():
        docs_dir = CORP_DOCS / dir_name
        if not docs_dir.exists():
            continue
        if sector_id not in ("travel_index", "game_design"):
            legal_dir = docs_dir / "legal_reference"
            if not legal_dir.exists():
                legal_dir = docs_dir

        # Determine which directories to scan
        scan_dirs = [docs_dir / "legal_reference"] if (docs_dir / "legal_reference").exists() else [docs_dir]
        # For crypto_treasury, only legal_reference
        if sector_id == "crypto_treasury":
            scan_dirs = [docs_dir / "legal_reference"] if (docs_dir / "legal_reference").exists() else []

        for scan_dir in scan_dirs:
            for ext in ("*.md", "*.json", "*.yaml", "*.yml", "*.txt"):
                for fpath in sorted(scan_dir.rglob(ext)):
                    # Skip directories
                    if any(s in fpath.parts for s in SKIP_DIRS):
                        continue
                    try:
                        content = fpath.read_text(errors='replace')
                    except Exception:
                        continue
                    doc_id = "doc-" + hashlib.md5(str(fpath).encode()).hexdigest()[:12]
                    cur.execute("""INSERT OR REPLACE INTO kd_knowledge
                        (id, title, category, sector_id, source, content, tags)
                        VALUES (?, ?, ?, ?, ?, ?, ?)""",
                        (doc_id, fpath.name, "legal", sector_id, str(fpath),
                         content[:8000], json.dumps([sector_id, "legal"])))
                    count += 1
                    sector_counts[sector_id] = sector_counts.get(sector_id, 0) + 1

    conn.commit()
    conn.close()
    print(f"Ingested {count} documents")
    for sector, cnt in sorted(sector_counts.items()):
        print(f"  {sector}: {cnt} docs")


def cmd_sync_status():
    """Sync subsidiary status from tracker + corporate_structure.json."""
    if not SUBSIDIARY_TRACKER.exists():
        print(f"ERROR: tracker not found at {SUBSIDIARY_TRACKER}")
        sys.exit(1)
    tracker = json.loads(SUBSIDIARY_TRACKER.read_text())
    conn = get_db()
    cur = conn.cursor()

    status_map = {
        "ready_for_legal_and_finance": "pending",
        "legal_formation_complete": "incubating",
        "formed": "active",
    }

    for sid, info in tracker["formation_status"].items():
        new_status = status_map.get(info["status"], "pending")
        # Read corporate_structure.json for additional fields
        dir_name = SECTOR_DIR_MAP.get(sid)
        if not dir_name:
            continue
        struct_path = CORP_DOCS / dir_name / "legal_reference" / "corporate_structure.json"
        if struct_path.exists():
            struct = json.loads(struct_path.read_text())
            cur.execute("""UPDATE kd_organizations SET
                entity_name=?, jurisdiction=?, entity_type=?, status=?,
                business_model=?, brand_identity=?, updated_at=CURRENT_TIMESTAMP
                WHERE id=?""",
                (struct.get("entity_name", ""), struct.get("jurisdiction", "[PENDING]"),
                 struct.get("entity_type", "[PENDING]"), new_status,
                 json.dumps(struct.get("business_model", {})),
                 json.dumps(struct.get("brand_identity", {})),
                 sid))
        else:
            cur.execute("UPDATE kd_organizations SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                        (new_status, sid))

    conn.commit()
    rows = cur.execute("SELECT id, name, status FROM kd_organizations WHERE type='subsidiary' ORDER BY id").fetchall()
    conn.close()
    print(f"Synced {len(rows)} subsidiaries:")
    for r in rows:
        print(f"  {r['name']:<35} → {r['status']}")


def cmd_serve():
    """Start HTTP API server."""
    import urllib.request as ulib

    class OSHandler(BaseHTTPRequestHandler):
        def _send(self, code, data):
            body = json.dumps(data).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _db_query(self, sql, params=()):
            conn = get_db()
            conn.row_factory = sqlite3.Row
            cur = conn.execute(sql, params)
            rows = [dict(r) for r in cur.fetchall()]
            conn.close()
            return rows

        def _db_exec(self, sql, params=()):
            conn = get_db()
            cur = conn.execute(sql, params)
            conn.commit()
            last_id = cur.lastrowid
            conn.close()
            return last_id

        def do_GET(self):
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path.rstrip("/")
            qs = urllib.parse.parse_qs(parsed.query)

            if path == "/health":
                self._send(200, {"status": "ok", "db": str(DB_PATH)})
            elif path == "/api/v1/orgs":
                self._send(200, self._db_query("SELECT * FROM kd_organizations ORDER BY name"))
            elif path.startswith("/api/v1/orgs/"):
                org_id = path.split("/")[3]
                rows = self._db_query("SELECT * FROM kd_organizations WHERE id=?", (org_id,))
                if rows:
                    self._send(200, rows[0])
                else:
                    self._send(404, {"error": "not found"})
            elif path == "/api/v1/projects":
                sql = "SELECT * FROM kd_projects WHERE 1=1"
                params = []
                if "company_id" in qs:
                    sql += " AND company_id=?"; params.append(qs["company_id"][0])
                if "status" in qs:
                    sql += " AND status=?"; params.append(qs["status"][0])
                sql += " ORDER BY created_at DESC"
                self._send(200, self._db_query(sql, params))
            elif path.startswith("/api/v1/projects/"):
                pid = path.split("/")[3]
                rows = self._db_query("SELECT * FROM kd_projects WHERE id=?", (pid,))
                if rows:
                    p = rows[0]
                    tasks = self._db_query("SELECT * FROM kd_tasks WHERE project_id=?", (pid,))
                    p["tasks"] = tasks
                    self._send(200, p)
                else:
                    self._send(404, {"error": "not found"})
            elif path == "/api/v1/tasks":
                sql = "SELECT * FROM kd_tasks WHERE 1=1"
                params = []
                if "status" in qs:
                    sql += " AND status=?"; params.append(qs["status"][0])
                if "agent_id" in qs:
                    sql += " AND assigned_agent_id=?"; params.append(qs["agent_id"][0])
                sql += " ORDER BY created_at DESC"
                self._send(200, self._db_query(sql, params))
            elif path == "/api/v1/agents":
                rows = self._db_query("SELECT * FROM kd_agents ORDER BY name")
                self._send(200, rows)
            elif path == "/api/v1/knowledge":
                q = qs.get("q", [""])[0]
                if q:
                    rows = self._db_query(
                        "SELECT * FROM kd_knowledge WHERE title LIKE ? OR content LIKE ? OR tags LIKE ? ORDER BY last_updated DESC LIMIT 20",
                        (f"%{q}%", f"%{q}%", f"%{q}%"))
                else:
                    rows = self._db_query("SELECT * FROM kd_knowledge ORDER BY last_updated DESC LIMIT 50")
                self._send(200, rows)
            elif path == "/api/v1/dashboard":
                orgs = self._db_query("SELECT * FROM kd_organizations")
                projects = self._db_query("SELECT * FROM kd_projects WHERE status IN ('active','blocked') ORDER BY priority DESC, created_at DESC")
                tasks = self._db_query("SELECT status, COUNT(*) as c FROM kd_tasks GROUP BY status")
                agents = self._db_query("SELECT * FROM kd_agents")
                task_summary = {r["status"]: r["c"] for r in tasks}
                summary = {
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "organizations": {
                        "total": len(orgs),
                        "subsidiaries": len([o for o in orgs if o["type"] == "subsidiary"]),
                        "active": len([o for o in orgs if o["status"] == "active"]),
                        "pending": len([o for o in orgs if o["status"] == "pending"]),
                    },
                    "projects": {
                        "total": len(projects) + len(self._db_query("SELECT * FROM kd_projects WHERE status NOT IN ('active','blocked')")),
                        "active": len([p for p in projects if p["status"] == "active"]),
                        "blocked": len([p for p in projects if p["status"] == "blocked"]),
                    },
                    "tasks": {
                        "todo": task_summary.get("todo", 0),
                        "in_progress": task_summary.get("in_progress", 0),
                        "review": task_summary.get("review", 0),
                        "done": task_summary.get("done", 0),
                        "blocked": task_summary.get("blocked", 0),
                    },
                    "agents": {"total": len(agents)},
                    "pipeline": [{
                        "priority": p["priority"],
                        "name": p["name"],
                        "company_id": p["company_id"],
                        "status": p["status"],
                    } for p in projects],
                }
                self._send(200, summary)
            else:
                self._send(404, {"error": "endpoint not found", "path": path})

        def do_POST(self):
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path.rstrip("/")
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length)) if length else {}

            if path == "/api/v1/tasks":
                task_id = "task-" + hashlib.md5(f"{body.get('title','')}{time.time()}".encode()).hexdigest()[:12]
                self._db_exec("""INSERT INTO kd_tasks
                    (id, title, description, project_id, assigned_agent_id, status, priority)
                    VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    (task_id, body.get("title",""), body.get("description",""),
                     body.get("project_id"), body.get("assigned_agent_id"),
                     body.get("status","todo"), body.get("priority","normal")))
                self._send(201, {"id": task_id, "status": "created"})
            else:
                self._send(404, {"error": "endpoint not found"})

        def log_message(self, fmt, *args):
            pass  # Suppress default logging

    srv = ThreadingHTTPServer(("0.0.0.0", API_PORT), OSHandler)
    print(f"KingDesign OS API on http://0.0.0.0:{API_PORT}")
    srv.serve_forever()


def cmd_cli():
    """CLI query subcommand."""
    args = sys.argv[2:]
    if not args:
        print("Usage: kd <orgs|projects|tasks|dashboard|knowledge|ask <q>>")
        return

    cmd = args[0]

    def fetch(path):
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{API_PORT}{path}", timeout=3) as r:
                return json.loads(r.read())
        except Exception as e:
            print(f"OS API unavailable: {e}")
            sys.exit(1)

    if cmd == "orgs":
        orgs = fetch("/api/v1/orgs")
        for o in orgs:
            tag = " [HOLDING]" if o["type"] == "holding" else ""
            print(f"  {o['name']:<35} {o['status']:<12}{tag}")

    elif cmd == "projects":
        qs = ""
        if len(args) > 1 and args[1] in ("active","blocked","planning"):
            qs = f"?status={args[1]}"
        elif len(args) > 2 and args[1] == "--company":
            qs = f"?company_id={args[2]}"
        projects = fetch(f"/api/v1/projects{qs}")
        for p in projects:
            print(f"  [{p['priority']:<8}] {p['name']:<35} {p['status']}")

    elif cmd == "tasks":
        status = "in_progress"
        if len(args) > 1:
            status = args[1]
        tasks = fetch(f"/api/v1/tasks?status={status}")
        for t in tasks:
            print(f"  {t['title']:<40} [{t['assigned_agent_id']}]")

    elif cmd == "dashboard":
        d = fetch("/api/v1/dashboard")
        print(json.dumps(d, indent=2))

    elif cmd == "knowledge":
        q = " ".join(args[1:]) if len(args) > 1 else ""
        path = "/api/v1/knowledge"
        if q:
            path += f"?q={urllib.parse.quote(q)}"
        docs = fetch(path)
        for d in docs:
            print(f"  [{d['sector_id']}] {d['title']}")

    elif cmd == "task-create":
        # Usage: kd task-create "Title" "Description" "agent_id" "priority"
        title = args[1] if len(args) > 1 else ""
        desc = args[2] if len(args) > 2 else ""
        agent = args[3] if len(args) > 3 else "hermes-ceo"
        priority = args[4] if len(args) > 4 else "normal"
        import urllib.request as ulib
        body = json.dumps({"title": title, "description": desc, "assigned_agent_id": agent, "priority": priority}).encode()
        req = ulib.Request(f"http://127.0.0.1:{API_PORT}/api/v1/tasks", data=body, headers={"Content-Type": "application/json"})
        try:
            with ulib.urlopen(req, timeout=5) as r:
                resp = json.loads(r.read())
                print(f"Created: {resp['id']} → {resp['status']}")
        except Exception as e:
            print(f"Error creating task: {e}")

    elif cmd == "task-done":
        # Usage: kd task-done <task_id>
        task_id = args[1] if len(args) > 1 else ""
        if not task_id:
            print("Usage: kd task-done <task_id>")
            return
        conn = get_db()
        conn.execute(
            "UPDATE kd_tasks SET status='done', updated_at=CURRENT_TIMESTAMP WHERE id=?",
            (task_id,)
        )
        conn.commit()
        conn.close()
        print(f"Task {task_id} marked done")

    elif cmd == "ask":
        query = " ".join(args[1:]).lower()
        orgs = fetch("/api/v1/orgs")
        if "status" in query and "vagary" in query:
            vulns = [o for o in orgs if o["sector_id"] == "vagary_index"]
            if vulns:
                v = vulns[0]
                projects = fetch(f"/api/v1/projects?company_id={v['id']}")
                active = [p for p in projects if p["status"] == "active"]
                print(f"Vagary Index: {v['status']}")
                print(f"Entity: {v['entity_name']}")
                print(f"Jurisdiction: {v['jurisdiction']}")
                print(f"Active projects: {len(active)}")
        elif "blocked" in query:
            tasks = fetch("/api/v1/tasks?status=blocked")
            print(f"Blocked tasks: {len(tasks)}")
            for t in tasks:
                print(f"  {t['title']}")
        elif "active projects" in query or "what projects" in query:
            projects = fetch("/api/v1/projects?status=active")
            print(f"Active projects ({len(projects)}):")
            for p in projects:
                print(f"  [{p['priority']}] {p['name']} — {p['company_id']}")
        elif "subsidiaries" in query:
            subsidiaries = [o for o in orgs if o["type"] == "subsidiary"]
            print(f"7 subsidiaries:")
            for s in subsidiaries:
                print(f"  {s['name']:<35} {s['status']}")
        else:
            print("Ask: 'status of vagary index', 'blocked tasks', 'active projects', 'subsidiaries'")


def cmd_orch():
    """Orchestration daemon — assigns unassigned tasks + dispatches to daemons."""
    SKILL_MAP = {
        "vagary_index":   ["travel", "country", "guide", "tiktok", "currency", "vagary"],
        "shoe_brand":     ["shoe", "inventory", "sneaker", "footwear", "ecommerce"],
        "gamedev":        ["aura", "card", "trinity", "nfc", "battle", "ue5", "unreal"],
        "kids":           ["bedtime", "story", "tts", "narration", "child-safe", "youtube"],
        "innovation":     ["patent", "white paper", "ip", "tech", "research"],
        "ewaste":         ["recycling", "gold", "copper", "palladium", "circuit"],
        "quantum":        ["thermal", "biometric", "wearable", "physics"],
    }

    AGENT_ID_MAP = {
        "vagary_index":   "athena-strategy",
        "shoe_brand":     "agent-shoes-lead",
        "gamedev":        "ares-games",
        "kids":           "agent-kids-lead",
        "innovation":     "oracle-research",
        "ewaste":         "agent-ewaste-lead",
        "quantum":        "agent-quantum-lead",
    }

    print(f"Orchestrator daemon starting (poll every 30s)")
    while True:
        try:
            conn = get_db()
            # 1. Auto-assign unassigned todo tasks
            unassigned = [dict(r) for r in conn.execute(
                "SELECT * FROM kd_tasks WHERE (assigned_agent_id IS NULL OR assigned_agent_id='') AND status='todo' ORDER BY priority DESC, created_at ASC LIMIT 5"
            ).fetchall()]

            for task in unassigned:
                desc = (task.get("description") or "").lower()
                title = (task.get("title") or "").lower()
                target = "hermes-ceo"
                for sector, keywords in SKILL_MAP.items():
                    if any(re.search(r'\b' + re.escape(kw) + r'\b', desc) or
                           re.search(r'\b' + re.escape(kw) + r'\b', title) for kw in keywords):
                        target = AGENT_ID_MAP.get(sector, "hermes-ceo")
                        break
                conn.execute(
                    "UPDATE kd_tasks SET assigned_agent_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                    (target, task["id"])
                )
                print(f"  ASSIGN: {task['title'][:50]} → {target}")
            conn.commit()  # Commit auto-assignments before reading in_progress

            # 2. Dispatch logging for in_progress tasks
            in_progress = [dict(r) for r in conn.execute(
                "SELECT * FROM kd_tasks WHERE status='in_progress' ORDER BY created_at ASC LIMIT 5"
            ).fetchall()]
            conn.close()

            for task in in_progress:
                desc = (task.get("description") or "").lower()
                target = None
                for div, keywords in SKILL_MAP.items():
                    if any(re.search(r'\b' + re.escape(kw) + r'\b', desc) for kw in keywords):
                        target = div
                        break
                if not target:
                    target = "hermes-ceo"
                assigned = task.get("assigned_agent_id") or "unassigned"
                print(f"  DISPATCH: {task['title'][:50]} → {target} (assigned: {assigned})")
        except Exception as e:
            print(f"  Orchestrator error: {e}")
        time.sleep(30)


def cmd_telegram():
    """Telegram CEO Q&A bridge."""
    token = TELEGRAM_TOKEN_FILE.read_text().strip()
    last_update = 0
    print(f"Telegram bridge starting (chat_id={CHAT_ID})")

    def send_msg(text):
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        data = urllib.parse.urlencode({"chat_id": CHAT_ID, "text": text, "parse_mode": "Markdown"}).encode()
        try:
            urllib.request.urlopen(urllib.request.Request(url, data=data), timeout=10)
        except Exception as e:
            print(f"  Telegram error: {e}")

    def fetch(path):
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{API_PORT}{path}", timeout=3) as r:
                return json.loads(r.read())
        except Exception:
            return None

    while True:
        try:
            url = f"https://api.telegram.org/bot{token}/getUpdates?offset={last_update + 1}&timeout=5"
            with urllib.request.urlopen(url, timeout=10) as r:
                data = json.loads(r.read())
            for upd in data.get("result", []):
                last_update = upd["update_id"]
                msg = upd.get("message", {})
                text = msg.get("text", "").lower().strip()
                if not text:
                    continue
                if "status" in text and "vagary" in text:
                    orgs = fetch("/api/v1/orgs")
                    if orgs:
                        v = [o for o in orgs if o["sector_id"] == "vagary_index"]
                        if v:
                            send_msg(f"Vagary Index: {v[0]['status']}\nEntity: {v[0]['entity_name']}\nJurisdiction: {v[0]['jurisdiction']}")
                elif "active projects" in text:
                    projects = fetch("/api/v1/projects?status=active")
                    if projects:
                        lines = [f"Active projects ({len(projects)}):"]
                        for p in projects[:10]:
                            lines.append(f"  [{p['priority']}] {p['name']} — {p['company_id']}")
                        send_msg("\n".join(lines))
                elif "blocked" in text:
                    tasks = fetch("/api/v1/tasks?status=blocked")
                    if tasks:
                        send_msg(f"Blocked tasks: {len(tasks)}\n" + "\n".join(t["title"] for t in tasks[:10]))
                elif "subsidiaries" in text:
                    orgs = fetch("/api/v1/orgs")
                    if orgs:
                        subs = [o for o in orgs if o["type"] == "subsidiary"]
                        lines = ["Subsidiaries:"]
                        for s in subs:
                            lines.append(f"  {s['name']}: {s['status']}")
                        send_msg("\n".join(lines))
                else:
                    send_msg("Ask: 'status of <subsidiary>', 'active projects', 'blocked tasks', 'subsidiaries'")
        except Exception as e:
            print(f"  Poll error: {e}")
        time.sleep(3)




# ─── Phase 2: Specialist Agent Daemons ────────────────────────────────────────

# Mapping: daemon name → (agent_id, skills_to_load, description)
DAEMON_REGISTRY = {
    "athena": (
        "athena-strategy",
        ["hermes-agent", "3-statement-model", "comps-analysis", "dcf-model", "osint-investigation"],
        "Business strategy & planning — roadmaps, market analysis, financial modeling"
    ),
    "oracle": (
        "oracle-research",
        ["research", "osint-investigation", "drug-discovery", "domain-intel"],
        "Research — documentation, competitor analysis, tech scouting"
    ),
    "daedalus": (
        "daedalus-web",
        ["software-development", "web-development"],
        "Web development — Next.js, React, TypeScript, API generation"
    ),
    "ares": (
        "ares-games",
        ["game-design", "aura-champions", "aura-ue-client", "ue5-win-local-build"],
        "UE5/VR/AR — gameplay, VR locomotion, AR spatial anchors, Aura Champions"
    ),
    "hephaestus": (
        "hephaestus-assets",
        ["blender-3d-modeler", "creative"],
        "3D asset production — Blender modeling, materials, UV, export"
    ),
    "vulcan": (
        "vulcan-infra",
        ["devops", "docker-management", "windows-local-stack-debugging"],
        "Infrastructure — Docker, CI/CD, deployments, monitoring"
    ),
    "hades": (
        "hades-qa",
        ["security", "hermes-verification-patterns"],
        "QA & audit — code review, security scanning, topology validation"
    ),
}

# Sector → agent_id mapping for task routing
SECTOR_AGENT_MAP = {
    "vagary_index": "agent-vagary-index-lead",
    "shoes": "agent-shoes-lead",
    "gamedev": "agent-gamedev-lead",
    "kids": "agent-kids-lead",
    "innovation": "agent-innovation-lead",
    "ewaste": "agent-ewaste-lead",
    "quantum": "agent-quantum-lead",
    "crypto_treasury": "finance",
}

# Queue directory for task dispatch
QUEUE_DIR = OS_DATA_DIR / "queue"

def run_daemon(agent_id, skills, description):
    """Generic daemon loop: poll for assigned tasks, dispatch via file-queue."""
    QUEUE_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[{agent_id}] daemon started — {description}")
    print(f"[{agent_id}] Skills: {', '.join(skills)}")
    
    while True:
        try:
            conn = get_db()
            tasks = conn.execute(
                "SELECT * FROM kd_tasks WHERE assigned_agent_id=? AND status IN ('todo','in_progress','blocked') ORDER BY priority DESC, created_at ASC LIMIT 3",
                (agent_id,)
            ).fetchall()
            conn.close()
            
            for task in tasks:
                task_id = task["id"]
                title = task["title"]
                desc = (task["description"] or "") if task["description"] else ""
                company_id = task["project_id"] or None
                priority = task["priority"] or "normal"
                
                if task["status"] == "in_progress":
                    continue  # Already being processed
                
                print(f"[{agent_id}] Picking up: {title[:60]}")
                
                # Mark in_progress
                mark_status(task_id, "in_progress", f"Dispatched to {agent_id} (skills: {','.join(skills)})")
                
                # Write task to file-queue for dispatch
                task_file = QUEUE_DIR / f"{task_id}.json"
                with open(task_file, "w") as f:
                    json.dump({
                        "task_id": task_id,
                        "agent_id": agent_id,
                        "skills": skills,
                        "title": title,
                        "description": desc,
                        "company_id": company_id,
                        "priority": priority,
                        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    }, f, indent=2)
                    f.flush()
                    os.fsync(f.fileno())
                
                print(f"[{agent_id}] Queued task {task_id} for dispatch")
                    
        except Exception as e:
            print(f"[{agent_id}] Error: {e}")
        
        time.sleep(10)

def mark_status(task_id, status, result=""):
    """Update a task's status in the DB."""
    conn = get_db()
    conn.execute(
        "UPDATE kd_tasks SET status=?, result=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
        (status, result, task_id)
    )
    conn.commit()
    conn.close()

def cmd_daemon():
    """Handle daemon:<name> commands."""
    if len(sys.argv) < 2 or sys.argv[1].startswith("daemon:"):
        name = sys.argv[1].split(":", 1)[1] if ":" in sys.argv[1] else sys.argv[1].replace("daemon:", "")
    else:
        print("Usage: kdos.py daemon:<name>")
        print(f"Available daemons: {', '.join(DAEMON_REGISTRY.keys())}")
        sys.exit(1)
    
    if name not in DAEMON_REGISTRY:
        print(f"Unknown daemon: {name}")
        print(f"Available: {', '.join(DAEMON_REGISTRY.keys())}")
        sys.exit(1)
    
    agent_id, skills, desc = DAEMON_REGISTRY[name]
    run_daemon(agent_id, skills, desc)


def cmd_cron_dispatch():
    """Cron job: poll queue/ directory and dispatch delegate_task calls.
    
    Reads JSON task request files from ~/.local/share/kingdesign-os/queue/,
    invokes the task, marks results in DB, and archives processed files.
    Can be called every 15s from a cron job.
    """
    import shutil
    import subprocess
    queue_dir = Path.home() / ".local" / "share" / "kingdesign-os" / "queue"
    archive_dir = queue_dir / "processed"
    archive_dir.mkdir(parents=True, exist_ok=True)
    
    if not queue_dir.exists():
        return
    
    for qf in sorted(queue_dir.glob("*.json")):
        # Rename to .lock to prevent race conditions
        lock_path = qf.with_suffix(".json.lock")
        try:
            os.rename(qf, lock_path)
        except OSError:
            continue  # Another process is working on it
        
        try:
            with open(lock_path) as f:
                req = json.load(f)
            
            task_id = req.get("task_id", "")
            agent_id = req.get("agent_id", "")
            skills = req.get("skills", [])
            title = req.get("title", "")
            desc = req.get("description", "")
            priority = req.get("priority", "normal")
            
            print(f"[cron_dispatch] Dispatching: {title[:60]}")
            print(f"  Agent: {agent_id}")
            print(f"  Skills: {', '.join(skills)}")
            print(f"  Priority: {priority}")
            
            # Build the delegate_task context
            # This is the bridge: cronjob → delegate_task with skills loaded
            context = (
                f"Task ID: {task_id}\n"
                f"Title: {title}\n"
                f"Description: {desc}\n"
                f"Agent: {agent_id}\n"
                f"Priority: {priority}\n"
                f"Skills to load: {', '.join(skills)}\n"
                f"Execute this task as efficiently as possible, using the specified "
                f"skills. Return results as structured output."
            )
            
            goal = f"Execute KingDesign OS task: {title}"
            
            # Use the delegate_task helper
            # The kdos.py _delegate function writes a task spec that the cronjob
            # system picks up and calls delegate_task
            result = subprocess.run(
                [sys.executable, str(Path(__file__).parent / "kdos.py"), "_delegate",
                 agent_id, json.dumps(skills), goal, context, task_id],
                capture_output=True, text=True, timeout=300
            )
            
            if result.returncode == 0:
                output = result.stdout.strip()
                if output:
                    result_data = json.loads(output) if output.startswith("{") else {"output": output}
                else:
                    result_data = {"output": "Subagent completed without output"}
                
                # Mark task done with results
                conn = get_db()
                conn.execute(
                    "UPDATE kd_tasks SET status=?, result=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                    ("done", json.dumps(result_data)[:2000], task_id)
                )
                conn.commit()
                conn.close()
                print(f"[cron_dispatch] DONE: {title[:60]}")
            else:
                # Mark blocked on failure
                conn = get_db()
                conn.execute(
                    "UPDATE kd_tasks SET status=?, result=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                    ("blocked", result.stderr[:2000], task_id)
                )
                conn.commit()
                conn.close()
                print(f"[cron_dispatch] BLOCKED: {title[:60]} — {result.stderr[:100]}")
            
        except json.JSONDecodeError:
            print(f"[cron_dispatch] Invalid JSON in {lock_path.name}")
            conn = get_db()
            conn.execute(
                "UPDATE kd_tasks SET status=?, result=? WHERE id=?",
                ("blocked", "Invalid JSON in queue file", "")
            )
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[cron_dispatch] Error: {e}")
        finally:
            # Archive the lock file
            if lock_path.exists():
                shutil.move(str(lock_path), str(archive_dir / lock_path.name))
    
    print(f"[cron_dispatch] Polling complete at {time.strftime('%H:%M:%S')}")


def cmd_agent_run():
    """agent:run <task_id> — Queue a task for immediate dispatch.
    
    Reads the task from the DB, determines the correct skill from the
    agent_id via DAEMON_REGISTRY / SKILL_ROUTING, and writes a structured
    dispatch file to the queue directory for the cronjob to pick up.
    """
    task_id = sys.argv[2] if len(sys.argv) > 2 else ""
    if not task_id:
        print("Usage: kdos.py agent:run <task_id>")
        sys.exit(1)

    conn = get_db()
    row = conn.execute("SELECT * FROM kd_tasks WHERE id=?", (task_id,)).fetchone()
    if not row:
        print(f"Task not found: {task_id}")
        sys.exit(1)

    task = dict(row)
    agent_id = task.get("assigned_agent_id") or "hermes-ceo"
    title = task.get("title", "")
    desc = task.get("description") or ""
    priority = task.get("priority", "normal")

    # Determine skill from routing
    skill = "hermes-agent"
    try:
        with open(SKILL_ROUTING) as f:
            routing = json.load(f)
        for sector, info in routing.items():
            if info.get("lead_agent") == agent_id:
                skill = info.get("skill", "hermes-agent")
                break
    except Exception:
        pass

    # Write dispatch file
    QUEUE_DIR.mkdir(parents=True, exist_ok=True)
    dispatch_file = QUEUE_DIR / f"{task_id}.json"
    with open(dispatch_file, "w") as f:
        json.dump({
            "task_id": task_id,
            "agent_id": agent_id,
            "skills": [skill, "hermes-agent"],
            "title": title,
            "description": desc,
            "priority": priority,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }, f, indent=2)
        f.flush()
        os.fsync(f.fileno())

    print(f"[agent:run] Queued {task_id} for {agent_id} (skill: {skill})")
    conn.close()


def cmd_delegate():
    """Internal: bridge command invoked by cron_dispatch to prepare delegate_task.
    
    Writes a structured task spec to stdout that a parent Hermes cronjob
    can use to invoke delegate_task with the correct skills loaded.
    This is the boundary between kdos.py (local daemon) and the Hermes runtime.
    """
    # Args: agent_id skills_json goal context task_id
    agent_id = sys.argv[2]
    skills = json.loads(sys.argv[3])
    goal = sys.argv[4]
    context = sys.argv[5] if len(sys.argv) > 5 else ""
    task_id = sys.argv[6] if len(sys.argv) > 6 else ""
    
    # Output a structured task spec
    spec = {
        "task_id": task_id,
        "agent_id": agent_id,
        "skill": skills[0] if skills else "hermes-agent",
        "skills": skills,
        "goal": goal,
        "context": context,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    print(json.dumps(spec))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: kdos.py <init|seed|ingest|sync-status|serve|cli|orch|telegram|daemon:<name>|cron_dispatch|agent:run <task_id>>")
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd.startswith("daemon:"):
        _daemon_name = cmd.split(":", 1)[1]
        if _daemon_name not in DAEMON_REGISTRY:
            print(f"Unknown daemon: {_daemon_name}")
            print(f"Available: {', '.join(DAEMON_REGISTRY.keys())}")
            sys.exit(1)
        _agent_id, _skills, _desc = DAEMON_REGISTRY[_daemon_name]
        run_daemon(_agent_id, _skills, _desc)
        sys.exit(0)
    commands = {
        "init": cmd_init,
        "seed": cmd_seed,
        "ingest": cmd_ingest,
        "sync-status": cmd_sync_status,
        "serve": cmd_serve,
        "cli": cmd_cli,
        "orch": cmd_orch,
        "telegram": cmd_telegram,
        "cron_dispatch": cmd_cron_dispatch,
        "agent:run": cmd_agent_run,
        "_delegate": cmd_delegate,
        "daemon:athena": lambda: cmd_daemon_athena(),
        "daemon:oracle": lambda: cmd_daemon_oracle(),
        "daemon:daedalus": lambda: cmd_daemon_daedalus(),
        "daemon:ares": lambda: cmd_daemon_ares(),
        "daemon:hephaestus": lambda: cmd_daemon_hephaestus(),
        "daemon:vulcan": lambda: cmd_daemon_vulcan(),
        "daemon:hades": lambda: cmd_daemon_hades(),
            }
    if cmd not in commands:
        print(f"Unknown command: {cmd}")
        print(f"Available: {', '.join(commands.keys())}")
        sys.exit(1)
    commands[cmd]()
