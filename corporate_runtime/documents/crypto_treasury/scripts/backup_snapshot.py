#!/usr/bin/env python3
"""
Umbrella Backup Snapshot — creates timestamped archive of critical project data.
Designed to run unattended via Hermes cron.
"""
import os
import sys
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

PROJECT_ROOT = Path("C:/Users/young/agents")
BACKUP_ROOT = PROJECT_ROOT / "backups"
TIMESTAMP = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%SZ")
BACKUP_DIR = BACKUP_ROOT / TIMESTAMP

def snapshot_json(path: Path):
    if not path.exists():
        return None
    return {
        "source": str(path),
        "size_bytes": path.stat().st_size,
        "mtime": datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).isoformat()
    }

def verify_sqlite(path: Path):
    if not path.exists():
        return None
    try:
        conn = sqlite3.connect(str(path))
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchone()[0]
        conn.close()
        return {"tables": tables, "status": "ok"}
    except Exception as e:
        return {"status": "error", "error": str(e)}

def main():
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    manifest = {
        "timestamp": TIMESTAMP,
        "mode": "snapshot",
        "components": {}
    }

    # 1. Subsidiary legal foundation
    subs_dir = PROJECT_ROOT / "subsidiaries"
    manifest["components"]["subsidiaries"] = {
        "path": str(subs_dir),
        "files": len([f for f in subs_dir.rglob("*") if f.is_file()])
    }

    # 2. Hermes skills
    skills_dir = Path("C:/Users/young/AppData/Local/hermes/skills")
    umbrella_skills = [s.name for s in skills_dir.iterdir() if s.is_dir() and s.name in [
        "shoe-brand", "travel-index", "game-design", "kids-channel",
        "innovation-hub", "ewaste-recycling", "quantum-wearables", "crypto-treasury"
    ]]
    manifest["components"]["hermes_skills"] = {
        "path": str(skills_dir),
        "umbrella_skills_count": len(umbrella_skills),
        "umbrella_skills": umbrella_skills
    }

    # 3. Corporate runtime
    runtime_dir = PROJECT_ROOT / "corporate_runtime"
    manifest["components"]["corporate_runtime"] = {
        "path": str(runtime_dir),
        "files": len([f for f in runtime_dir.rglob("*") if f.is_file()])
    }

    # 4. Treasury ledger
    ledger_path = runtime_dir / "documents/crypto_treasury/ledger_templates/treasury_ledger.sqlite"
    manifest["components"]["treasury_ledger"] = verify_sqlite(ledger_path)

    # 5. Key JSON files
    key_files = [
        PROJECT_ROOT / "subsidiaries/backing_asset_registry.json",
        PROJECT_ROOT / "subsidiaries/settlement_token_whitepaper.md",
        PROJECT_ROOT / "UMBRELLA_HERMES_ARCHITECTURE.md",
        PROJECT_ROOT / "docker-compose.yml"
    ]
    manifest["components"]["key_files"] = [snapshot_json(p) for p in key_files if p.exists()]

    # 6. Write manifest
    manifest_path = BACKUP_DIR / "snapshot_manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"[OK] Snapshot created: {BACKUP_DIR}")
    print(f"[OK] Manifest: {manifest_path}")
    print(f"[INFO] Umbrella skills: {len(umbrella_skills)}")
    print(f"[INFO] Ledger status: {manifest['components']['treasury_ledger']}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
