# KingDesign OS Phase 5 — Execution Completeness

> **For Hermes:** Complete the missing delegate_task bridge and orchestrator auto-assignment.

**Goal:** Close the last gap in the KingDesign OS execution pipeline — make the file-queue → `delegate_task` bridge actually invoke real Hermes subagents, and fix the orchestrator to auto-assign unassigned tasks.

---

## Current Context

The system has:
- `kdos.py daemon:<name>` — 7 daemons that poll for tasks, mark in_progress, write to queue/
- `kdos.py cron_dispatch` — cron job that reads queue/ and calls `_delegate` (local stub)
- `kdos.py cmd_orch` — orchestrator that polls tasks but doesn't auto-assign to agent IDs
- n8n with 3 workflows imported

**Gap:** `cron_dispatch` calls `_delegate` which just outputs JSON — it doesn't actually call `delegate_task` to spawn a Hermes subagent. The bridge needs to be a Hermes cronjob that reads queue files and invokes `delegate_task` with the loaded skills.

---

## Approach

Instead of fixing n8n (which can't call Hermes tools), use a **Hermes cron job** that:
1. Runs every minute
2. Reads queue/ directory for pending task JSON files
3. Calls `delegate_task` with the specified skills loaded
4. Updates the DB with results
5. Archives processed files

Also fix `cmd_orch` to auto-assign unassigned `todo` tasks to the correct agent IDs based on `os_skill_routing.json`.

---

## Step-by-Step Plan

### Task 1: Fix cmd_orch to auto-assign tasks

**Objective:** When orchestrator finds a `todo` task with `assigned_agent_id=NULL`, read the description, determine the sector, and assign to the correct agent ID.

**File:** `C:\Users\young\agents\.hermes\scripts\kdos.py` — modify `cmd_orch` function

**Current code (around line 810-850):**
The orchestrator currently just prints dispatch targets. It needs to actually UPDATE `kd_tasks.assigned_agent_id` for unassigned tasks.

**Step 1: Add agent ID mapping to cmd_orch**

```python
# In cmd_orch, add this mapping alongside the existing sector routing:
AGENT_ID_MAP = {
    "vagary_index": "agent-vagary-index-lead",
    "shoes": "agent-shoes-lead",
    "gamedev": "agent-gamedev-lead",
    "kids": "agent-kids-lead",
    "innovation": "agent-innovation-lead",
    "ewaste": "agent-ewaste-lead",
    "quantum": "agent-quantum-lead",
    "crypto_treasury": "agent-crypto-lead",
}
```

**Step 2: Add auto-assignment logic**

```python
def route_unassigned_tasks(conn, routing):
    """Assign unassigned todo tasks to the correct agent based on sector keywords."""
    tasks = conn.execute(
        "SELECT id, title, description FROM kd_tasks WHERE assigned_agent_id IS NULL OR assigned_agent_id = ''"
    ).fetchall()
    
    for task in tasks:
        desc = (task["description"] or "").lower()
        title = (task["title"] or "").lower()
        target_agent = "hermes-ceo"  # default
        
        for sector, info in routing.items():
            skill = info.get("skill", "")
            keywords = SKILL_KEYWORDS.get(sector, [])
            if any(kw in desc or kw in title for kw in keywords):
                target_agent = AGENT_ID_MAP.get(sector, f"agent-{sector}-lead")
                break
        
        conn.execute(
            "UPDATE kd_tasks SET assigned_agent_id=?, status='todo', updated_at=CURRENT_TIMESTAMP WHERE id=?",
            (target_agent, task["id"])
        )
        print(f"[orchestrator] Assigned task '{task['title'][:40]}' → {target_agent}")
    
    conn.commit()
```

**Step 3: Call route_unassigned_tasks in the orchestrator loop**

Add this call at the top of each poll iteration, before the dispatch logging.

### Task 2: Create kdos.py agent:run subcommand

**Objective:** A new `agent:run` subcommand that reads a queue file and invokes the actual execution logic (calls delegate_task conceptually via a Python subprocess that loads the right Hermes tool).

**File:** `C:\Users\young\agents\.hermes\scripts\kdos.py` — add `cmd_agent_run()`

**Implementation:**
```python
def cmd_agent_run():
    """agent:run <task_id> — Execute a single task by ID.
    Loads the task spec and invokes the appropriate skill.
    Writes results back to the DB."""
    task_id = sys.argv[2]
    conn = get_db()
    task = conn.execute(
        "SELECT * FROM kd_tasks WHERE id=?", (task_id,)
    ).fetchone()
    
    if not task:
        print(f"Task not found: {task_id}")
        sys.exit(1)
    
    conn = dict(task) if task else None
    conn.close()
    
    agent_id = task["assigned_agent_id"] or "hermes-ceo"
    title = task["title"]
    desc = task["description"] or ""
    
    # Determine skill from routing
    skill = "hermes-agent"
    for sector, info in routing.items():
        if info.get("lead_agent") == agent_id:
            skill = info.get("skill", "hermes-agent")
            break
    
    print(f"[agent:run] Executing: {title[:60]}")
    print(f"  Agent: {agent_id}")
    print(f"  Skill: {skill}")
    
    # Update status
    db = get_db()
    db.execute("UPDATE kd_tasks SET status='in_progress', updated_at=CURRENT_TIMESTAMP WHERE id=?", (task_id,))
    db.commit()
    db.close()
    
    # Execute via the appropriate agent function
    result = execute_task(task_id, agent_id, skill, title, desc)
    
    # Mark complete
    db = get_db()
    db.execute("UPDATE kd_tasks SET status='done', result=?, updated_at=CURRENT_TIMESTAMP WHERE id=?", (json.dumps(result)[:2000], task_id))
    db.commit()
    db.close()
    
    print(f"[agent:run] DONE: {title[:60]}")
```

### Task 3: Update orchestrator to use agent:run instead of file-queue dispatch

**Objective:** Replace the file-queue write in `run_daemon` with actual `agent:run` invocation, or keep the file-queue but have the cron job call `agent:run`.

**File:** `C:\Users\young\agents\.hermes\scripts\kdos.py`

The simplest fix: update `cron_dispatch` to call `kdos.py agent:run <task_id>` instead of `kdos.py _delegate ...`. This way the cron job actually runs the task through the proper kdos.py execution path.

**Step 1: Update cmd_cron_dispatch**

Change the subprocess call from:
```python
[result = subprocess.run([sys.executable, str(KDOS_SCRIPT), "_delegate", ...])]
```
to:
```python
[result = subprocess.run([sys.executable, str(KDOS_SCRIPT), "agent:run", task_id], ...)]
```

### Task 4: Add Hermes cronjob for queue polling

**Objective:** Schedule a recurring cronjob that runs `cron_dispatch` every minute.

**File:** Use `cronjob` tool directly.

```
cronjob create --schedule "* * * * *" \
  --prompt "Run kdos.py cron_dispatch to process pending task queue files" \
  --workdir "C:\\Users\\young\\agents"
```

**Note:** The existing cronjob (`aa19c17b2db4`) was created with deliver=local. Verify it's running.

### Task 5: Update os_skill_routing.json with toolsets

**Objective:** Each routing entry already has `toolsets`. Verify they match the actual skill toolsets. No file change needed — just verify.

### Task 6: Integration test — full pipeline

**Objective:** End-to-end test with real task execution.

**Steps:**
1. Ensure API server running: `kd serve &`
2. Ensure orchestrator running: `kd orch &`
3. Start Athena daemon: `kd daemon:athena &`
4. Create task: `kd task-create "Test full pipeline" "Research Vagary market trends" "athena-strategy" "high"`
5. Wait 15s (daemon picks up → queue file)
6. Wait 60s (cron job runs → agent:run → done)
7. Verify: `curl http://127.0.0.1:8090/api/v1/tasks?type=done`

**Expected:** Task goes todo → in_progress → done, with results in the DB.

---

## Files That Will Change

| File | Action |
|------|--------|
| `kdos.py` | Add `cmd_agent_run()`, fix `cmd_cron_dispatch` to call `agent:run`, fix `cmd_orch` for auto-assignment |
| `os_skill_routing.json` | Verify (no change expected) |

## Verification

- `python kdos.py agent:run <task_id>` should execute a task to completion
- `python kdos.py cron_dispatch` should process queue files via `agent:run`
- Orchestra should auto-assign unassigned tasks within 30s
- Full pipeline: create → auto-assign → daemon picks up → cron runs → done

## Risks

1. **delegate_task depth:** The daemon runs as a leaf subagent. `agent:run` is called via subprocess (not delegate_task), so no depth issue.
2. **Cron job timing:** 1-minute cron resolution means tasks may wait up to 60s. Acceptable for current use case.
3. **Agent execution scope:** `agent:run` uses kdos.py logic, not actual Hermes subagent skills. The n8n bridge would be needed for real subagent integration.
