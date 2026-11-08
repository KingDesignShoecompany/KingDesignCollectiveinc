# KingDesign OS Phase 5 — Live Execution & Deployment

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Get KingDesign OS running as a live autonomous system — start kdos daemons, wire cronjob → delegate_task, deploy TMA to GitHub Pages, and establish recurring Telegram CEO reports.

**Architecture:** The kdos.py services (API, orch, athena daemon) run as background processes. The cronjob reads queue files and uses `delegate_task` to spawn real Hermes subagents with the correct skills. The TMA at `/tma` is deployed to GitHub Pages and launches inside Telegram. CEO Daily Report cron delivers a dashboard summary to @Bbyuponbot every morning.

**Tech Stack:** Python 3.12 (kdos.py), Next.js 15.5 (kdc-next), GitHub Pages, Telegram Bot API, Hermes cron scheduler

---

## Tasks

### Task 1: Start kdos API server with ThreadingHTTPServer

**Objective:** Get the OS API server running on :8090 with concurrent request handling.

**Files:**
- `C:/Users/young/agents/.hermes/scripts/kdos.py` (already updated with ThreadingHTTPServer)

**Step 1: Verify ThreadingHTTPServer is in use**

Run: `grep "ThreadingHTTPServer" .hermes/scripts/kdos.py`
Expected: `from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer` and `srv = ThreadingHTTPServer(("0.0.0.0", API_PORT), OSHandler)`

**Step 2: Start the API server in background**

Run: `python .hermes/scripts/kdos.py serve` (background, notify_on_complete)
Expected: "KingDesign OS API on http://0.0.0.0:8090"

**Step 3: Verify health endpoint**

Run: `curl -s http://127.0.0.1:8090/health`
Expected: `{"status": "ok", "db": "C:/Users/young/.local/share/kingdesign-os/kdos.db"}`

---

### Task 2: Start kdos orchestrator daemon

**Objective:** Start the orchestrator that auto-assigns unassigned tasks to agents.

**Step 1: Start in background**

Run: `python .hermes/scripts/kdos.py orch` (background)
Expected: "Orchestrator daemon starting (poll every 30s)"

**Step 2: Verify it polls correctly**

Run: `sleep 32 && curl -s "http://127.0.0.1:8090/api/v1/tasks?status=todo"`
Expected: JSON array — at least one task assigned to an agent_id

---

### Task 3: Start kdos Athena daemon

**Objective:** Start the Athena (strategy) daemon that picks up assigned tasks and writes to queue.

**Step 1: Start in background**

Run: `python .hermes/scripts/kdos.py daemon:athena` (background)
Expected: "[athena-strategy] daemon started" + "[athena-strategy] Picking up:"

**Step 2: Verify queue files are created**

Run: `ls ~/.local/share/kingdesign-os/queue/ 2>&1`
Expected: JSON files with task_id, agent_id, skills list

---

### Task 4: Wire cronjob to real delegate_task

**Objective:** Update the KDOS queue dispatcher cronjob to actually spawn subagents instead of calling the `_delegate` stub.

**Current issue:** The cronjob calls `kdos.py cron_dispatch` which invokes `kdos.py _delegate` — this only outputs a JSON spec, it doesn't actually run anything. We need the cronjob to be a proper Hermes agent that reads queue files and calls `delegate_task`.

**Files:**
- Cronjob `aa19c17b2db4` (KDOS queue dispatcher)

**Step 1: Update cronjob prompt**

The cronjob prompt should:
1. Scan `~/.local/share/kingdesign-os/queue/` for `*.json` files
2. For each file: read task_id, agent_id, skills, goal, context
3. Call `delegate_task` with the loaded skills and context
4. Mark the task done in the DB via `kdos.py` CLI
5. Move the file to `processed/`

**Step 2: Update the cronjob**

Run via `cronjob action='update'`:
- Schedule: `* * * * *`
- Skills: `["hermes-agent"]`
- Workdir: `C:\Users\young\agents`
- Prompt: "Scan C:/Users/young/.local/share/kingdesign-os/queue/ for JSON task files (exclude processed/ dir). For each file, call delegate_task with the task's skills loaded and context containing goal, title, description. After delegate_task returns, call `python .hermes/scripts/kdos.py cli task-done <task_id>` to mark done. Move the file to processed/. If no files, exit silently."

**Step 3: Verify**

Run: `cronjob action='list'` (check updated prompt)

---

### Task 5: Schedule CEO Daily Report cronjob

**Objective:** Set up a recurring Telegram report that delivers dashboard summary to @Bbyuponbot every morning.

**Step 1: Create cronjob**

Run via `cronjob action='create'`:
- Name: `CEO Daily Report`
- Schedule: `0 8 * * *` (daily at 8 AM)
- Skills: `["hermes-agent"]`
- Workdir: `C:\Users\young\agents`
- Prompt: "Fetch the KingDesign OS dashboard from http://127.0.0.1:8090/api/v1/dashboard. Format the results as a Telegram message for @Bbyuponbot showing: organizations summary (subsidiaries active/pending), task breakdown (todo/in_progress/done/blocked), agent count, and active pipeline projects. Send via Telegram to chat_id 8866994677. If the API is unreachable, note that in the message."

**Step 2: Verify**

Run: `cronjob action='list'` and confirm the job exists with correct schedule.

**Step 3: Test manually**

Run: `cronjob action='run' --job_id=<id>`
Expected: Telegram message received in @Bbyuponbot

---

### Task 6: Deploy updated kdc-next with TMA to GitHub Pages

**Objective:** Deploy the TMA route so it's accessible at `https://kingdesignshoecompany.github.io/KingDesignCollectiveinc/tma/`.

**Step 1: Build the app**

Run: `cd ~/agents/kdc-next && npm run build`
Expected: Build succeeds with TMA route included

**Step 2: Verify build output**

Run: `ls out/KingDesignCollectiveinc/tma/`
Expected: `index.html` exists in the TMA directory

**Step 3: Deploy to GitHub Pages**

Run: `npx gh-pages -c "git add -A && git commit -m 'feat: add Telegram Mini App route' && git push"`

Or use the existing CI:
Run: `git add src/app/tma/ src/app/api/tma/ src/lib/tma-*.ts src/components/tma/ src/app/page.tsx next.config.js .env.example && git commit -m "feat: add Telegram Mini App for KingDesign OS" && git push`

Expected: GitHub Actions deploys to `kingdesignshoecompany.github.io/KingDesignCollectiveinc/`

---

### Task 7: Final E2E test

**Objective:** Verify the full pipeline end-to-end.

**Step 1: Create a test task**

Run: `curl -X POST http://127.0.0.1:8090/api/v1/tasks -H "Content-Type: application/json" -d '{"title":"E2E: Telegram report summary","description":"Generate daily CEO report summary for Telegram delivery using hermes-agent and osint-investigation skills","priority":"high"}'`

Expected: `{"id":"task-...","status":"created"}`

**Step 2: Wait for orchestrator + daemon (45s)**

Run: `sleep 45`

**Step 3: Verify task is queued**

Run: `ls ~/.local/share/kingdesign-os/queue/ 2>&1`
Expected: JSON file with task_id + skills

**Step 4: Run cron_dispatch manually**

Run: `python .hermes/scripts/kdos.py cron_dispatch`
Expected: "[cron_dispatch] Dispatching:" + "[cron_dispatch] DONE:"

**Step 5: Verify task completed**

Run: `curl -s "http://127.0.0.1:8090/api/v1/tasks?status=done" | python -c "import sys,json; d=json.load(sys.stdin); print(len(d), 'done tasks')"`
Expected: N done tasks (incremented from 6)

---

### Task 8: Full system verification

**Objective:** Confirm all components are running and interacting correctly.

**Step 1: Verify all services running**

Run: `ps aux 2>/dev/null | grep -E "kdos|serve|daemon|orch" | grep -v grep`
Expected: kdos serve, kdos orch, kdos daemon:athena all running

**Step 2: Verify API health**

Run: `curl -s http://127.0.0.1:8090/health`
Expected: `{"status": "ok"}`

**Step 3: Verify DB state**

Run: `python -c "import sqlite3; conn=sqlite3.connect('~/.local/share/kingdesign-os/kdos.db'); print('orgs:', conn.execute('SELECT COUNT(*) FROM kd_organizations').fetchone()[0]); print('agents:', conn.execute('SELECT COUNT(*) FROM kd_agents').fetchone()[0]); print('tasks:', conn.execute('SELECT COUNT(*) FROM kd_tasks').fetchone()[0]); print('docs:', conn.execute('SELECT COUNT(*) FROM kd_knowledge').fetchone()[0])"`

Expected: 8 orgs, 29+ agents, 6+ tasks, 57+ docs

**Step 4: Verify cronjobs**

Run: `cronjob action='list'`
Expected: both "KDOS queue dispatcher" and "CEO Daily Report" present and active

**Step 5: Verify TMA builds**

Run: `cd ~/agents/kdc-next && npx tsc --noEmit`
Expected: no errors

---

## Risks

1. **Daemon process lifecycle** — background daemons may die if the terminal session closes. Mitigation: use `nohup` + `&` pattern, or rely on the cronjob to restart them.
2. **Cronjob delegate_task timeout** — `delegate_task` may time out at 600s for complex tasks. Keep dispatched tasks lightweight, with auto-repair logic in kdos.py.
3. **kdc-next static export + API proxy** — TMA routes work client-side, but the `:8090` API must be accessible from the deployed domain. Mitigation: use environment-based URL config.
4. **Telegram bot token security** — must not be committed to git. `.env.local` is gitignored, `.env.example` has placeholder.
5. **ThreadingHTTPServer port conflict** — need to kill any old `serve` process before starting new one on :8090.
