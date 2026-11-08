#!/usr/bin/env python3
"""
KingDesign Corporate / kdos.py — Knowledge Database OS.

Subcommands:
  init    — Create / reset the SQLite database and kd_knowledge table.
  ingest  — Walk each subsidiary's legal_reference/ directory and ingest
            .md/.json documents into kd_knowledge with sector_id mapping.
  verify  — Print per-sector row counts from kd_knowledge.

Sector → directory mapping (per task spec):
  travel_index        → travel_index
  shoes               → shoe_brand
  gamedev             → game_design
  kids                → kids_channel
  innovation          → innovation_hub
  ewaste              → ewaste_recycling
  quantum             → quantum_wearables
  crypto_treasury     → crypto_treasury

Skip paths: keys/, node_modules/, .env, logs/, quarantine/.
"""

import argparse
import hashlib
import json
import os
import sqlite3
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

DEFAULT_DB_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "kd_knowledge.db"
)
DEFAULT_DOCS_ROOT = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "documents"
)

# Mapping: directory name under documents/ → sector_id stored in DB
SECTOR_DIR_MAP = {
    "travel_index": "travel_index",
    "shoe_brand": "shoes",
    "game_design": "gamedev",
    "kids_channel": "kids",
    "innovation_hub": "innovation",
    "ewaste_recycling": "ewaste",
    "quantum_wearables": "quantum",
    "crypto_treasury": "crypto_treasury",
}

# Reverse lookup: sector_id → directory name (for ingest)
SECTOR_TO_DIR = {v: k for k, v in SECTOR_DIR_MAP.items()}

# Directories / paths to never ingest
SKIP_DIRS = {"keys", "node_modules", ".env", "logs", "quarantine", ".git"}
SKIP_FILENAMES = {".env"}

# Table schema
SCHEMA_KD_KNOWLEDGE = """
CREATE TABLE IF NOT EXISTS kd_knowledge (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    sector_id   TEXT    NOT NULL,
    doc_name    TEXT    NOT NULL,        -- filename (e.g. articles_of_incorporation.md)
    doc_path    TEXT    NOT NULL,        -- full path on disk
    file_type   TEXT    NOT NULL,        -- 'md' or 'json'
    content     TEXT,                    -- raw file content for .md; JSON-serialized text for .json
    sha256      TEXT    NOT NULL,        -- content hash for dedup / change detection
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sector_id, doc_path)
)
"""


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_connection(db_path: str) -> sqlite3.Connection:
    """Return a SQLite connection, creating the file if needed."""
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(db_path: str) -> None:
    """Create the database schema (kd_knowledge table)."""
    conn = get_connection(db_path)
    conn.executescript(SCHEMA_KD_KNOWLEDGE)
    conn.commit()
    conn.close()
    print(f"[init] Database created at: {db_path}")


# ---------------------------------------------------------------------------
# Ingest helpers
# ---------------------------------------------------------------------------

def _should_skip_path(rel_parts: tuple[str, ...]) -> bool:
    """Return True if any component of a relative path is in SKIP_DIRS."""
    for part in rel_parts:
        if part in SKIP_DIRS:
            return True
    return False


def _file_type(filename: str) -> str | None:
    """Return 'md' or 'json' based on extension, or None if unsupported."""
    lower = filename.lower()
    if lower.endswith(".md"):
        return "md"
    if lower.endswith(".json"):
        return "json"
    return None


def _read_content(file_path: str, file_type: str) -> str:
    """Read file content; for JSON, return pretty-printed string."""
    with open(file_path, "r", encoding="utf-8") as f:
        if file_type == "json":
            data = json.load(f)
            return json.dumps(data, indent=2, sort_keys=True, ensure_ascii=False)
        return f.read()


def _sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _ingest_directory(
    conn: sqlite3.Connection,
    dir_path: str,
    sector_id: str,
    docs_root: str,
) -> int:
    """
    Ingest all .md/.json files from dir_path (recursive, skipping excluded dirs).
    Returns the number of files ingested.
    """
    ingested = 0
    dir_path = os.path.abspath(dir_path)

    for root, dirs, files in os.walk(dir_path):
        # Filter out skipped directories in-place so os.walk doesn't descend
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and d not in SKIP_FILENAMES]

        rel_parts = os.path.relpath(root, dir_path).split(os.sep)
        if rel_parts == ["."]:
            rel_parts = ()
        if _should_skip_path(rel_parts):
            continue

        for fname in sorted(files):
            if fname in SKIP_FILENAMES:
                continue
            ftype = _file_type(fname)
            if ftype is None:
                continue

            full_path = os.path.join(root, fname)
            content = _read_content(full_path, ftype)
            checksum = _sha256(content)
            rel_doc_path = os.path.relpath(full_path, docs_root)

            conn.execute(
                """
                INSERT INTO kd_knowledge
                    (sector_id, doc_name, doc_path, file_type, content, sha256)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(sector_id, doc_path) DO UPDATE SET
                    doc_name   = excluded.doc_name,
                    file_type  = excluded.file_type,
                    content    = excluded.content,
                    sha256     = excluded.sha256,
                    created_at = CURRENT_TIMESTAMP
                """,
                (sector_id, fname, rel_doc_path, ftype, content, checksum),
            )
            ingested += 1

    return ingested


def ingest_docs(db_path: str, docs_root: str) -> int:
    """
    Walk all subsidiary directories under docs_root and ingest their
    legal_reference/ folders into the kd_knowledge table.
    """
    docs_root = os.path.abspath(docs_root)
    if not os.path.isdir(docs_root):
        print(f"[ingest] ERROR: documents root not found: {docs_root}", file=sys.stderr)
        return 1

    conn = get_connection(db_path)
    total = 0

    for dir_name, sector_id in SECTOR_DIR_MAP.items():
        legal_dir = os.path.join(docs_root, dir_name, "legal_reference")
        if not os.path.isdir(legal_dir):
            print(f"[ingest] ⚠  legal_reference not found: {legal_dir}")
            continue
        count = _ingest_directory(conn, legal_dir, sector_id, docs_root)
        conn.commit()
        print(f"[ingest] {sector_id:20s} ← {dir_name:20s} : {count} docs")
        total += count

    conn.close()
    print(f"[ingest] Total documents ingested: {total}")
    return 0


# ---------------------------------------------------------------------------
# Verify helpers
# ---------------------------------------------------------------------------

def verify_counts(db_path: str) -> int:
    """Print per-sector row counts from kd_knowledge."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    # Per-sector counts
    rows = conn.execute(
        """
        SELECT sector_id, COUNT(*) as cnt
        FROM kd_knowledge
        GROUP BY sector_id
        ORDER BY sector_id
        """
    ).fetchall()

    print("\n=== Per-Sector Counts (kd_knowledge) ===")
    if not rows:
        print("(no data — run `kdos.py ingest` first)")
        conn.close()
        return 1

    grand_total = 0
    for r in rows:
        print(f"  {r['sector_id']:20s}: {r['cnt']}")
        grand_total += r["cnt"]
    print(f"  {'TOTAL':20s}: {grand_total}")

    # Breakdown by file type per sector
    print("\n=== By File Type ===")
    detail = conn.execute(
        """
        SELECT sector_id, file_type, COUNT(*) as cnt
        FROM kd_knowledge
        GROUP BY sector_id, file_type
        ORDER BY sector_id, file_type
        """
    ).fetchall()
    for r in detail:
        print(f"  {r['sector_id']:20s} {r['file_type']:6s}: {r['cnt']}")

    conn.close()
    return 0


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        prog="kdos",
        description="KingDesign Corporate Knowledge DB CLI",
    )
    parser.add_argument(
        "--db", default=DEFAULT_DB_PATH,
        help=f"Path to SQLite DB file (default: {DEFAULT_DB_PATH})",
    )
    parser.add_argument(
        "--docs-root", default=DEFAULT_DOCS_ROOT,
        help=f"Root documents directory (default: {DEFAULT_DOCS_ROOT})",
    )

    sub = parser.add_subparsers(dest="command", required=True)

    p_init = sub.add_parser("init", help="Create the kd_knowledge table")
    p_init.set_defaults(command="init")

    p_ingest = sub.add_parser("ingest", help="Ingest legal_reference docs into kd_knowledge")
    p_ingest.set_defaults(command="ingest")

    p_verify = sub.add_parser("verify", help="Show per-sector counts")
    p_verify.set_defaults(command="verify")

    args = parser.parse_args()

    if args.command == "init":
        init_db(args.db)
        return 0
    elif args.command == "ingest":
        return ingest_docs(args.db, args.docs_root)
    elif args.command == "verify":
        return verify_counts(args.db)
    else:
        parser.print_help()
        return 1


if __name__ == "__main__":
    sys.exit(main())
