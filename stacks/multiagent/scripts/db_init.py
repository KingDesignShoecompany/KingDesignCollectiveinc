import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "project.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS stack_services (
    service TEXT PRIMARY KEY,
    status TEXT,
    port TEXT,
    health TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS agent_sectors (
    sector TEXT PRIMARY KEY,
    status TEXT,
    agent_count INTEGER,
    notes TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_type TEXT,
    record_count INTEGER,
    status TEXT,
    detail TEXT,
    synced_at TEXT
);
"""

def init_db(conn=None):
    close = False
    if conn is None:
        conn = sqlite3.connect(DB_PATH)
        close = True
    conn.executescript(SCHEMA)
    if close:
        conn.commit()
        conn.close()
