# KingDesign OS Phase 1 — Autonomous Executive Orchestration Layer (Rev 2)

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build a Hermes-native autonomous OS layer that turns Hermes from a task-executor into the CEO/COO of KingDesign Collective — orchestrating the 7 subsidiaries (Vagary Index, KingDesignShoeCompany, Aura Champions/gamedev, Seven Minute Story Sessions/kids, King Design Collective Briheight Box/innovation, KingDesign E-Collective/ewaste, Quantum Mode/quantum), routing work to specialist divisions (web, UE5/VR/AR, Blender, content, research), and maintaining continuous Observe-Plan-Assign-Execute-Validate-Repair-Deliver loops — all running through local Ollama/Hermes only, no external cloud.

**Architecture (Revised):** Switched from PostgreSQL to **SQLite** (Python stdlib `sqlite3` module) — zero Docker, zero C-build deps, single file at `~/.local/share/kingdesign-os/kdos.db`. Same schema, same logic, no external service to manage. The API is Python stdlib HTTP on port 8090. n8n is still used for scheduled workflows where available, with cron fallbacks. The kdc-next Next.js site extends to consume the OS API.

**Tech Stack:**
- **Database:** SQLite (stdlib `sqlite3`) — single file, no Docker, no psql client needed
- **Backend:** Python 3.12 stdlib HTTP server (`http.server`, `json`, `urllib`) — no pip installs except `pyyaml` (installed via uv)
- **YAML parsing:** `pip install pyyaml` (via uv pip install --system)
- **Orchestration:** Background daemon + cronjob for fallback scheduling
- **Frontend:** kdc-next (Next.js 15 + TypeScript + Tailwind) — extend existing
- **Agent routing:** `delegate_task` (3 concurrent max for this user)
- **Telegram:** Bot token from `~/agents/telegram_bot_token.txt`, chat_id `8866994677`
- **Secrets:** CLASS-1 crypto keys under `corporate_runtime/documents/crypto_treasury/keys/` — never ingested, never routed

---

## Environment Check (What's Available)

| Tool | Status | Notes |
|------|--------|-------|
| Python 3.12 | ✓ (`python`) | No python3 alias, but `python` works |
| uv 0.11.28 | ✓ | Can install pyyaml |
| sqlite3 | ✓ (stdlib) | No DB server needed |
| psycopg2 | ✗ | Not needed — switched to sqlite3 |
| pyyaml | ✗ | Install via `uv pip install --system pyyaml` |
| psql | ✗ | Not needed — sqlite3 only |
| node v24 | ✓ | For kdc-next build |
| pnpm 10 | ✓ | For kdc-next |
| Docker | ✓ | Available but containers not running — avoid dependency |
| n8n | ✗ (down) | Design workflows as JSON exports, import when n8n is up |
| Postgres :5432 | ✗ (down) | Switched to SQLite — no dependency |
| Telegram bot | ✓ | Token at `~/agents/telegram_bot_token.txt` |

---

## Prioritized Task List (Revised for Tool Availability)

### Task 1: Install dependencies & init SQLite DB (⏱ 2 min)
Install `pyyaml`, create the SQLite schema, verify tables.

### Task 2: Seed organization & agent registry (⏱ 3 min)
Read `registry/manifest.yaml` + `corporate_runtime/documents/*/legal_reference/corporate_structure.json`, populate 8 orgs + 8+ agents.

### Task 3: Build OS API server (⏱ 5 min)
Python stdlib HTTP on :8090 with all CRUD + dashboard endpoint.

### Task 4: Build CLI tool `kd` (⏱ 3 min)
Query + natural-language ask + dashboard. Depends on Task 3.

### Task 5: Create consolidated OS script bundle (⏱ 5 min)
Merge Tasks 1-4 into a single `~/.hermes/scripts/kdos.py` that can `init`, `seed`, `serve`, `cli` via subcommands — eliminates inter-process coordination.

### Task 6: Ingest corporate docs into knowledge base (⏱ 3 min)
Read all 7 subsidiaries' legal_reference + read crypto_treasury legal_reference (skip keys/), store in `kd_knowledge` table.

### Task 7: Subsidiary status sync (⏱ 2 min)
Read `subsidiary_formation_tracker.json`, update org statuses.

### Task 8: Wire Hermes skills to sectors (⏱ 2 min)
Create `~/.hermes/skills/os_skill_routing.json` mapping 7 sectors → skills.

### Task 9: Build orchestration engine daemon (⏱ 8 min)
Background poll loop: reads `kd_tasks` where status='todo', dispatches to Hermes skills. Uses `delegate_task` when local, or creates subagent dispatch plan.

### Task 10: n8n workflow definitions (⏱ 5 min)
Create 3 n8n workflow JSON exports: CEO daily report, doc ingestion, task dispatcher. Designed as importable JSON (n8n is currently down, so these are ready to import when it's up).

### Task 11: Telegram CEO Q&A bridge (⏱ 5 min)
Background daemon: polls Telegram, answers queries via `kd ask` logic. Depends on Task 5.

### Task 12: Extend kdc-next dashboard (⏱ 5 min)
Add `/os/admin` route or extend existing dashboard page to fetch from local :8090 API with fallback to mock data.

---

## Execution Order (Dependencies)

```
Task 1 (install + schema) 
    ├─ Task 2 (seed) ──┐
    ├─ Task 3 (API) ───┼── Task 4 (CLI) ─┐
    │                  ├─ Task 5 (bundle) ─┼── Task 11 (telegram)
    ├─ Task 6 (ingest) ─┘
    ├─ Task 7 (sync status)
    ├─ Task 8 (skill routing)
    ├─ Task 9 (orchestrator daemon)
    ├─ Task 10 (n8n workflows)
    └─ Task 12 (kdc-next frontend)
```

Batch 1 (parallel, no deps): Tasks 1, 6, 7, 8, 10
Batch 2 (after Task 1): Tasks 2, 3
Batch 3 (after Task 3): Tasks 4, 5
Batch 4 (after Task 5): Tasks 9, 11
Batch 5 (independent): Task 12

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `~/.hermes/scripts/kdos.py` | CREATE — single script: init, seed, serve, cli, orchestrate |
| `~/.hermes/scripts/kd_telegram.py` | CREATE — Telegram bridge daemon |
| `~/.hermes/skills/os_skill_routing.json` | CREATE — sector→skill mapping |
| `~/corporate_runtime/documents/integration/workflows/ceo_daily_report.json` | CREATE — n8n workflow export |
| `~/corporate_runtime/documents/integration/workflows/task_dispatcher.json` | CREATE — n8n workflow export |
| `~/corporate_runtime/documents/integration/workflows/ingest_corporate_docs.json` | CREATE — n8n workflow export |
| `kdc-next/src/lib/kdos.ts` | CREATE — API client |
| `kdc-next/src/data/dashboard.ts` | MODIFY — add API fetch with fallback |

---

## Verification (Run After Implementation)

```bash
# 1. DB initialized with 8 orgs
kd orgs

# 2. API health
curl -s http://127.0.0.1:8090/health

# 3. Dashboard summary
kd dashboard

# 4. Knowledge base has legal docs
curl -s "http://127.0.0.1:8090/api/v1/knowledge?q=incorporation" | python -c "import sys,json; print(len(json.load(sys.stdin)))"

# 5. Skill routing has all 7 sectors
python -c "import json; d=json.load(open('~/.hermes/skills/os_skill_routing.json')); print(len(d),'sectors')"

# 6. kdc-next builds with new integration
cd kdc-next && npm run build 2>&1 | tail -3
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| pyyaml install fails on Windows | Fallback: write a minimal YAML parser in pure Python (50 lines) for the manifest.yaml structure we control |
| n8n not running | Workflows designed as JSON exports — importable when n8n is available; cronjob fallback for daily report |
| Telegram API rate limits | Poll every 5s, batch responses |
| kdc-next static export can't call :8090 at runtime | Client-side fetch with graceful fallback to existing mock data |
| DB file locked on Windows | SQLite WAL mode, single-writer pattern (API is the only writer)</
| CLASS-1 data leak | Ingest script explicitly skips `crypto_treasury/keys/` directory |

---

## Complete: SQLite Schema (kdos.db)

```sql
CREATE TABLE kd_organizations (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    type          TEXT CHECK (type IN ('holding','subsidiary','division')),
    parent_id     TEXT,
    sector_id     TEXT,
    entity_name   TEXT,
    jurisdiction  TEXT,
    entity_type   TEXT,
    status        TEXT DEFAULT 'pending',
    business_model TEXT,  -- JSON string
    brand_identity TEXT,  -- JSON string
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kd_agents (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    role            TEXT NOT NULL,
    type            TEXT CHECK (type IN ('orchestrator','leaf','exec')),
    sector_id       TEXT,
    toolsets        TEXT,  -- JSON array string
    active_project_ids TEXT,  -- JSON array string
    config          TEXT,  -- JSON string
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kd_projects (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    company_id    TEXT,
    type          TEXT CHECK (type IN ('web','ai','vr','ar','game','media','brand','research','infra')),
    status        TEXT DEFAULT 'planning',
    priority      TEXT CHECK (priority IN ('critical','high','normal','low')),
    owner_agent   TEXT,
    description   TEXT,
    milestones    TEXT,  -- JSON string
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kd_tasks (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    description     TEXT,
    project_id      TEXT,
    assigned_agent_id TEXT,
    status          TEXT DEFAULT 'todo' CHECK (status IN ('todo','in_progress','review','done','blocked')),
    priority        TEXT CHECK (priority IN ('critical','high','normal','low')),
    due_date        TIMESTAMP,
    result          TEXT,  -- JSON string
    metadata        TEXT,  -- JSON string
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kd_assets (
    id            TEXT PRIMARY KEY,
    project_id    TEXT,
    name          TEXT NOT NULL,
    type          TEXT CHECK (type IN ('model','texture','audio','code','video','document','data')),
    path          TEXT,
    version       TEXT,
    owner_agent   TEXT,
    metadata      TEXT,  -- JSON string
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kd_knowledge (
    id            TEXT PRIMARY KEY,
    title         TEXT NOT NULL,
    category      TEXT CHECK (category IN ('business','engineering','marketing','media','legal','research')),
    sector_id     TEXT,
    source        TEXT,
    content       TEXT,
    tags          TEXT,  -- JSON array string
    last_updated  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kd_metrics (
    id          TEXT PRIMARY KEY,
    company_id  TEXT,
    name        TEXT,
    value       REAL,
    unit        TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kd_workflows (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    trigger_type TEXT CHECK (trigger_type IN ('cron','webhook','manual','poll')),
    schedule    TEXT,
    definition  TEXT,  -- JSON string (full node graph)
    status      TEXT DEFAULT 'paused' CHECK (status IN ('active','paused','error')),
    last_run    TIMESTAMP,
    next_run    TIMESTAMP,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
