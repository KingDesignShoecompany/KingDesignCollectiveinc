# KingDesign OS Phase 4 — Execution Bridge

> **For Hermes:** Wire the file-queue to actual `delegate_task` subagent spawning.

**Goal:** Close the gap between the file-queue (where daemons write task requests with skills) and actual Hermes subagent execution. A cron-polled dispatcher reads queue files and invokes `delegate_task` with the correct skills loaded.

---

## Architecture

```
User creates task (kd task-create)
  → kdos.py orch (30s poll)
    → routes to agent_id via os_skill_routing.json
  → kdos.py daemon:<name> (10s poll)
    → marks in_progress in DB
    → writes task request JSON to queue/
  → kdos.py cron_dispatch (15s cron job)
    → reads queue/ files
    → calls delegate_task with skills
    → subagent executes (depth 1, no recursion)
    → writes results back to DB
    → clears queue file
```

## Files

| File | Action |
|------|--------|
| `kdos.py` | Add `cmd_cron_dispatch()` function |
| `kdos.py` | Register in commands dict |
| `docker-compose.n8n-only.yml` | Add cron service (or use Hermes cronjob) |

## Step 1: Add `cmd_cron_dispatch` to kdos.py

```python
def cmd_cron_dispatch():
    """Cron job: poll queue/ directory, dispatch delegate_task calls.
    Runs every 15s via cron. For each queue file:
      1. Read the task request JSON
      2. Use subprocess to invoke a Hermes delegate_task helper
      3. Mark task done in DB
      4. Archive/remove queue file
    """
    import json, os
    from pathlib import Path
    
    queue_dir = Path.home() / ".local" / "share" / "kingdesign-os" / "queue"
    archive_dir = queue_dir / "processed"
    archive_dir.mkdir(parents=True, exist_ok=True)
    
    if not queue_dir.exists():
        return
    
    for qf in sorted(queue_dir.glob("*.json")):
        try:
            with open(qf) as f:
                req = json.load(f)
            
            task_id = req.get("task_id", "")
            agent_id = req.get("agent_id", "")
            skills = req.get("skills", [])
            title = req.get("title", "")
            desc = req.get("description", "")
            
            print(f"[cron] Dispatching: {title[:50]} → {agent_id}")
            print(f"  Skills: {skills}")
            
            # The delegate_task is invoked via the kdos.py _delegate helper
            # which writes a task spec that the cronjob system picks up
            result = subprocess.run(
                [sys.executable, str(Path(__file__).parent / "kdos.py"), "_delegate",
                 agent_id, json.dumps(skills), title, desc, task_id],
                capture_output=True, text=True, timeout=300
            )
            
            if result.returncode == 0:
                # Mark task done
                conn = get_db()
                conn.execute(
                    "UPDATE kd_tasks SET status=?, result=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                    ("done", result.stdout[:2000], task_id)
                )
                conn.commit()
                conn.close()
                print(f"[cron] DONE: {title[:50]}")
            else:
                # Mark blocked on failure
                conn = get_db()
                conn.execute(
                    "UPDATE kd_tasks SET status=?, result=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                    ("blocked", result.stderr[:2000], task_id)
                )
                conn.commit()
                conn.close()
                print(f"[cron] BLOCKED: {title[:50]} — {result.stderr[:100]}")
            
            # Archive the queue file
            import shutil
            shutil.move(str(qf), str(archive_dir / qf.name))
            
        except Exception as e:
            print(f"[cron] Error processing {qf.name}: {e}")
```

## Step 2: Register in commands dict

```python
commands = {
    ...
    "cron_dispatch": cmd_cron_dispatch,
}
```

## Step 3: Schedule via Hermes cronjob

```bash
cronjob create --schedule "every 15s" \
  --prompt "Run kd cron_dispatch to process the file-queue and invoke delegate_task for pending tasks" \
  --skills hermes-agent \
  --workdir ~/agents
```

Or manually:
```bash
*/1 * * * * cd ~/agents && for i in 1 2 3 4; do python .hermes/scripts/kdos.py cron_dispatch; sleep 15; done
```

## Step 4: End-to-End Test

```bash
# Terminal 1: API + orchestrator + Athena daemon
kd serve &
kd orch &
kd daemon:athena &

# Terminal 2: Create task
kd task-create "Research Vagary Index" "Analyze travel market in African countries" "athena-strategy" "high"

# Terminal 3: Cron dispatcher
kd cron_dispatch   # (or let the scheduled cron job handle it)

# Verify
kd tasks in_progress  # should show the task
curl http://127.0.0.1:8090/api/v1/dashboard
```

## Risks

1. **cronjob system doesn't support 15s intervals natively** — cron is minimum 1 minute. Solution: use a loop with sleep inside the cronjob prompt, or use `process(action="poll")` on a background terminal.

2. **delegate_task from cronjob**: The cronjob runs as a fresh session with no chat context. The `kdos.py _delegate` helper must be self-contained.

3. **Timeout**: `delegate_task` via cron may time out at 600s for complex tasks. Keep dispatch lightweight.

4. **Queue race conditions**: Multiple cron runs could pick up the same file. Solution: rename to `.lock` before processing.
