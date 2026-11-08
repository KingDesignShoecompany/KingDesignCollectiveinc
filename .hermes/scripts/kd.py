#!/usr/bin/env python
"""kd — KingDesign OS CLI wrapper.
Calls kdos.py cli subcommand.

Usage:
  kd orgs                          List all organizations
  kd tasks [status]                List tasks by status
  kd dashboard                     Show executive dashboard summary
  kd knowledge [query]             Search knowledge base
  kd ask "question"                Natural language query
  kd task-create "title" "desc" "agent" "priority"  Create a task
  kd task-done <task_id>                    Mark task complete
  kd orch                                   Start orchestrator daemon
  kd daemon:athena                 Start Athena strategy daemon
  kd serve                         Start OS API server (via kdos.py)
"""
import sys, os, subprocess
from pathlib import Path

KDOS_SCRIPT = Path.home() / "agents" / ".hermes" / "scripts" / "kdos.py"

if len(sys.argv) < 2:
    print(__doc__)
    sys.exit(0)

# Commands that go to kdos.py cli (not direct subcommands)
CLI_COMMANDS = {"orgs", "projects", "tasks", "dashboard", "knowledge", "ask", "task-create", "task-done"}

if sys.argv[1] in CLI_COMMANDS:
    result = subprocess.run(
        [sys.executable, str(KDOS_SCRIPT), "cli"] + sys.argv[1:],
        cwd=str(Path.home() / "agents")
    )
    sys.exit(result.returncode)
else:
    # Pass through to kdos.py directly (serve, orch, daemon:*, etc.)
    result = subprocess.run(
        [sys.executable, str(KDOS_SCRIPT)] + sys.argv[1:],
        cwd=str(Path.home() / "agents")
    )
    sys.exit(result.returncode)
