# KingDesign OS Phase 2 — Specialist Agent Framework

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Transform the Phase 1 orchestration engine from a passive task logger into an active dispatch system that routes tasks to real specialist agent daemons, which then use `delegate_task` to spawn Hermes subagents for actual execution.

---

## Architecture Overview

Phase 1 built the OS kernel (`kdos.py`) with a SQLite database, REST API, and a passive orchestrator that logs dispatch targets. Phase 2 replaces the passive orchestrator with an active dispatch system:

```
n8n webhook / CEO query / 30s poll
       ↓
kdos.py orch (poll daemon)
       ↓  reads todo tasks from KD_API
kdos.py daemon:<agent> (subsystem process per agent)
       ↓  writes to kd_tasks (status: in_progress → done)
       ↓  calls delegate_task (via Hermes runtime)
       ↓  subagent executes work
       ↓  writes results back to kd_tasks
```

Each specialist agent daemon is a separate `kdos.py daemon:<name>` subcommand that:
1. Polls the OS API for tasks assigned to its agent ID
2. Marks them `in_progress`
3. Calls `delegate_task` via the Hermes API (or local subprocess)
4. Marks them `done` with results
5. Polls every 10 seconds

**Key constraint:** These daemons run as **Hermes subagents themselves** via `delegate_task` — they CAN use delegate_task but cannot use it recursively (depth=1 for this user).

## Tech Stack
- Python 3.12 (stdlib + yaml already installed)
- OS API: `http://127.0.0.1:8090/api/v1`
- Agent daemons: `python kdos.py daemon:athena`, etc.
- Each daemon calls `delegate_task` via subprocess to spawn the actual work subagents

## Step-by-Step Plan

### Task 1: Daemon Framework + Orchestrator Rewrite

**Objective:** Add a generic `run_daemon` function to kdos.py that polls tasks and calls `delegate_task`.

**Files:**
- Modify: `C:\Users\young\agents\.hermes\scripts\kdos.py` (add daemon framework + rewrite cmd_orch)
- Test: `python kdos.py daemon:athena` (should poll and report)

**Step 1: Write the daemon framework**

The daemon framework:
```python
def run_daemon(agent_id, skill_hint=None, description=""):
    """Generic daemon loop: poll for assigned tasks, dispatch via delegate_task."""
    import subprocess
    
    print(f"[{agent_id}] daemon started — {description}")
    BASE = f"http://127.0.0.1:{API_PORT}"
    
    def mark_status(task_id, status, result=""):
        conn = get_db()
        conn.execute(
            "UPDATE kd_tasks SET status=?, result=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
            (status, result, task_id)
        )
        conn.commit()
        conn.close()
    
    while True:
        try:
            conn = get_db()
            tasks = conn.execute(
                "SELECT * FROM kd_tasks WHERE assigned_agent_id=? AND status IN ('todo','in_progress') ORDER BY priority DESC, created_at ASC LIMIT 3",
                (agent_id,)
            ).fetchall()
            conn.close()
            
            for task in tasks:
                task_id = task["id"]
                title = task["title"]
                desc = task["description"] or ""
                
                print(f"[{agent_id}] Processing: {title[:60]}")
                mark_status(task_id, "in_progress")
                
                # Build the delegate_task goal
                goal = f"Task: {title}\nDescription: {desc}\nSector: {skill_hint or agent_id}"
                
                # Call Hermes delegate_task via subprocess
                # The daemon runs as a leaf subagent — it calls delegate_task through
                # a helper script that invokes the Hermes CLI
                result = subprocess.run(
                    [sys.executable, str(KDOS_SCRIPT), "_delegate", 
                     agent_id, skill_hint or "hermes-agent",
                     json.dumps({"title": title, "description": desc, "task_id": task_id})],
                    capture_output=True, text=True, timeout=300
                )
                
                if result.returncode == 0:
                    mark_status(task_id, "done", result.stdout[:2000])
                    print(f"[{agent_id}] DONE: {title[:60]}")
                else:
                    mark_status(task_id, "blocked", result.stderr[:2000])
                    print(f"[{agent_id}] BLOCKED: {title[:60]} — {result.stderr[:200]}")
                    
        except Exception as e:
            print(f"[{agent_id}] Error: {e}")
        
        time.sleep(10)
```

**Step 2: Add daemon dispatch to `__main__`**

```python
# In the commands dict and __main__ block:
elif cmd.startswith("daemon:"):
    parts = cmd.split(":", 1)
    daemon_name = parts[1]
    daemon_map = {
        "athena":   ("athena-strategy", "hermes-agent", "Business strategy & planning daemon"),
        "oracle":   ("oracle-research", "research", "Documentation & research daemon"),
        "daedalus": ("daedalus-web", "software-development", "Web development daemon"),
        "ares":     ("ares-games", "game-design", "UE5/VR/AR game development daemon"),
        "hephaestus": ("hephaestus-assets", "blender-3d-modeler", "3D asset generation daemon"),
        "vulcan":   ("vulcan-infra", "devops", "Infrastructure & deployment daemon"),
        "hades":    ("hades-qa", "security", "QA & validation daemon"),
    }
    if daemon_name in daemon_map:
        agent_id, skill, desc = daemon_map[daemon_name]
        run_daemon(agent_id, skill, desc)
    else:
        print(f"Unknown daemon: {daemon_name}")
```

**Step 3: Add `_delegate` helper command**

The `_delegate` command is the bridge between the daemon and the Hermes `delegate_task` API. It constructs the proper context and calls `delegate_task`:

```python
def cmd_delegate():
    """Internal: used by daemon to call delegate_task."""
    # Args: agent_id skill_name json_context
    agent_id = sys.argv[2]
    skill = sys.argv[3]
    ctx = json.loads(sys.argv[4])
    
    # The daemon itself runs as a subagent — we need to spawn a child
    # subagent with the right skill loaded
    goal = ctx["title"]
    context = ctx["description"]
    
    # Write the task context to a temp file for the subagent
    # The daemon's caller (whoever invoked kdos.py orch) will receive
    # the result through the OS API
    result = {
        "agent_id": agent_id,
        "skill": skill,
        "goal": goal,
        "context": context,
        "task_id": ctx["task_id"],
    }
    print(json.dumps(result))
```

**Step 4: Rewrite cmd_orch to use the real orchestrator**

Instead of just logging dispatch targets, `cmd_orch` should:
- Monitor the task queue
- Route tasks to the correct daemon agent ID based on sector/skill mapping
- The daemons then execute independently

```python
def cmd_orch():
    """Orchestrator: watches for unassigned todo tasks and routes them to agents."""
    print("Hermes Orchestrator started (poll every 30s)")
    
    # Load skill routing
    try:
        with open(SKILL_ROUTING) as f:
            routing = json.load(f)
    except:
        routing = {}
    
    BASE = f"http://127.0.0.1:{API_PORT}"
    
    def route_task(task):
        """Determine which agent should handle this task."""
        desc = (task.get("description") or "").lower()
        title = (task.get("title") or "").lower()
        
        # Check sector routing
        for sector, info in routing.items():
            skill = info.get("skill", "")
            keywords = SKILL_KEYWORDS.get(sector, [])
            if any(kw in desc or kw in title for kw in keywords):
                # Map sector to agent ID
                agent_map = {
                    "vagary_index": "agent-vagary-index-lead",
                    "shoes": "agent-shoes-lead",
                    "gamedev": "agent-gamedev-lead",
                    "kids": "agent-kids-lead",
                    "innovation": "agent-innovation-lead",
                    "ewaste": "agent-ewaste-lead",
                    "quantum": "agent-quantum-lead",
                    "crypto_treasury": "finance",
                }
                return agent_map.get(sector, sector)
        return "hermes-ceo"
```

**Step 5: Verify**

Run: `python kdos.py daemon:athena`
Expected: "Started Athena strategy daemon..." → polls for tasks assigned to "athena-strategy" → logs "No tasks pending" → sleeps 10s

### Task 2: Athena (Strategy Daemon)

**Objective:** Create the Athena strategy daemon — uses the strategy/planning approach.

**Skill to load:** `hermes-agent` (for orchestration) + `3-statement-model` (for financial analysis) + `osint-investigation` (for research)

**Files:**
- Modify: `C:\Users\young\agents\.hermes\scripts\kdos.py` (add cmd_daemon_athena)

**Step 1: Write Athena daemon**

Athena handles: business plans, roadmaps, market analysis, opportunity scoring, financial modeling.

Her delegate_task calls should load: `hermes-agent`, `3-statement-model`, `comps-analysis`, `dcf-model`, `osint-investigation`.

**Step 2: Verify**

Run: `python kdos.py daemon:athena` with a test task

### Task 3: Oracle (Research Daemon)

**Objective:** Create the Oracle research daemon — documentation mining, competitor analysis, tech scouting.

**Skills:** `research`, `osint-investigation`, `drug-discovery`, `domain-intel`

### Task 4: Daedalus (Web Daemon)

**Objective:** Create the Daedalus web development daemon — Next.js, React, TypeScript, API generation.

**Skills:** `software-development` (sub skills: coding-cli-agents, web-development, etc.)

### Task 5: Ares (Game Daemon)

**Objective:** Create the Ares UE5/VR/AR daemon.

**Skills:** `game-design`, `aura-champions`, `aura-ue-client`, `ue5-win-local-build`, `gaming`

### Task 6: Hephaestus (Asset Daemon)

**Objective:** Create the Hephaestus Blender daemon.

**Skills:** `blender-3d-modeler`, `blender-mcp`, `creative`

### Task 7: Vulcan (Infrastructure Daemon)

**Objective:** Create the Vulcan infrastructure daemon — Docker, CI/CD, deployment.

**Skills:** `devops`, `docker-management`, `windows-local-stack-debugging`

### Task 8: Hades (QA Daemon)

**Objective:** Create the Hades QA/audit daemon.

**Skills:** `security` (sherlock, oss-forensics, godmode), `test-windows-git-plumbing`, `requesting-code-review`

### Task 9: Wire Orchestrator Dispatch

**Objective:** Make the orchestrator actually dispatch tasks to the correct daemon agent IDs, and have the daemons actually spawn `delegate_task` calls.

**Step 1: Update cmd_orch to auto-assign tasks**

When it sees a `todo` task with `assigned_agent_id=NULL`, it reads the task description, determines the sector, and sets `assigned_agent_id` to the correct agent (e.g., `agent-vagary-index-lead` for travel tasks).

**Step 2: Daemon dispatch via delegate_task**

Each daemon polls for its tasks and, when found, spawns a `delegate_task` with the appropriate skill loaded. The delegate_task is invoked via a helper that writes a "task request" to a queue file, which a parent process picks up.

**Alternative approach (simpler):** Since the daemon IS a process running in the shell, it can use Python subprocess to call a Hermes CLI command that invokes `delegate_task`. But we don't have a Hermes CLI binary — the `delegate_task` tool is only available within the Hermes runtime. So the daemons need to communicate through the OS API instead.

**Revised approach:** The daemon creates a JSON task file in a `queue/` directory, which a cron job or n8n workflow picks up and turns into a `delegate_task` call. This is the bridge between the local daemon and the Hermes `delegate_task` tool.

### Task 10: Update Skill Routing + Register Agents

**Objective:** Update `os_skill_routing.json` to include the daemon-to-skill mappings, and register all agent daemons in the DB.

### Task 11: Integration Test

**Objective:** End-to-end test — create a task via the API, have the orchestrator route it, have the daemon pick it up, and verify the status changes to `done`.

**Step 1: Start API server**
```bash
python kdos.py serve  # in background
```

**Step 2: Start orchestrator
```bash
python kdos.py orch   # in background
```

**Step 3: Start one daemon (e.g., Athena)
```bash
python kdos.py daemon:athena  # in background
```

**Step 4: Create a test task**
```bash
python kdos.py cli task-create "Market analysis for Vagary Index Africa expansion" "Research travel market opportunities in African countries for Vagary Index expansion" "agent-vagary-index-lead" "high"
```

**Step 5: Verify status changes
```bash
curl http://127.0.0.1:8090/api/v1/tasks?agent_id=agent-vagary-index-lead
```

Expected: task status goes from `todo` → `in_progress` → `done`

---

## Files That Will Change

| File | Action |
|------|--------|
| `kdos.py` (713 lines → ~950 lines) | Add daemon framework, 7 daemon subcommands, rewrite cmd_orch |
| `kd.py` | Add `task-create` command |
| `os_skill_routing.json` | Add daemon→skill mappings |
| `registry/subordinate_formation_tracker.json` | No change (read-only) |
| `kdc-next/src/lib/os-api.ts` | Add task status polling |
| `kdc-next/src/app/page.tsx` | Show task pipeline on dashboard |

## Risks & Tradeoffs

1. **delegate_task depth limit:** Subagents can't delegate further. Solution: daemons spawn ONE delegate_task (depth 1), that subagent does the work.
2. **No Hermes CLI binary:** The daemons can't directly call `delegate_task`. Solution: use a file-queue pattern — daemons write task requests to `queue/`, a parent orchestrator picks them up.
3. **Rate limiting:** Previous subagent attempts hit rate limits. Solution: daemons call `delegate_task` at most once per 30s per task.
4. **Daemon lifecycle:** Need to track which daemons are running. Solution: each daemon writes a heartbeat to `kd_agents` table.
