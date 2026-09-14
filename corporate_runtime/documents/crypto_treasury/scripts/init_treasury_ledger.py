#!/usr/bin/env python3
"""
Crypto Treasury Ledger — SQLite migration and initialization.
Replaces JSON-file ledger with ACID-backed SQLite database.
"""

import sqlite3
import json
import os
from pathlib import Path

DB_PATH = Path("C:/Users/young/agents/corporate_runtime/documents/crypto_treasury/ledger_templates/treasury_ledger.sqlite")
LEGACY_JSON = Path("C:/Users/young/agents/subsidiaries/token_issuance_ledger.json")
BACKING_REGISTRY = Path("C:/Users/young/agents/corporate_runtime/documents/crypto_treasury/legal_reference/backing_asset_registry.json")

def init_schema(conn):
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS treasury_reserves (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            asset_class TEXT NOT NULL,
            subsidiary TEXT NOT NULL,
            asset_type TEXT NOT NULL,
            quantity REAL NOT NULL,
            unit TEXT NOT NULL,
            spot_value_usd REAL NOT NULL,
            valuation_date TEXT NOT NULL,
            signature TEXT,
            verified INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS atm_nodes (
            node_id TEXT PRIMARY KEY,
            region TEXT NOT NULL,
            city TEXT NOT NULL,
            status TEXT NOT NULL,
            fiat_pair TEXT NOT NULL,
            liquidity_reserve_usd TEXT,
            operator TEXT,
            settlement_protocol TEXT NOT NULL,
            last_rebalanced TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS settlement_transactions (
            tx_id TEXT PRIMARY KEY,
            node_id TEXT NOT NULL,
            direction TEXT NOT NULL,
            token_amount REAL NOT NULL,
            fiat_amount REAL NOT NULL,
            fiat_currency TEXT NOT NULL,
            status TEXT NOT NULL,
            payload_signature TEXT,
            settled_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (node_id) REFERENCES atm_nodes(node_id)
        );

        CREATE TABLE IF NOT EXISTS backing_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subsidiary TEXT NOT NULL,
            primary_class TEXT NOT NULL,
            secondary_class TEXT NOT NULL,
            minted_allocation TEXT,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_reserves_subsidiary ON treasury_reserves(subsidiary);
        CREATE INDEX IF NOT EXISTS idx_reserves_date ON treasury_reserves(valuation_date);
        CREATE INDEX IF NOT EXISTS idx_transactions_node ON settlement_transactions(node_id);
        CREATE INDEX IF NOT EXISTS idx_backing_subsidiary ON backing_assets(subsidiary);
    """)
    print("[OK] Schema initialized")

def migrate_legacy_ledger(conn):
    if not LEGACY_JSON.exists():
        print("[SKIP] Legacy ledger JSON not found")
        return
    with open(LEGACY_JSON, "r") as f:
        data = json.load(f)
    # Placeholder: actual migration depends on legacy schema
    # For now, seed backing_assets from backing_asset_registry if present
    print("[OK] Legacy ledger migration placeholder")

def seed_backing_registry(conn):
    if not BACKING_REGISTRY.exists():
        print("[SKIP] Backing registry not found")
        return
    with open(BACKING_REGISTRY, "r") as f:
        registry = json.load(f)
    cursor = conn.cursor()
    for subsidiary, info in registry.get("subsidiary_backing", {}).items():
        cursor.execute(
            "INSERT OR REPLACE INTO backing_assets (subsidiary, primary_class, secondary_class, minted_allocation) VALUES (?, ?, ?, ?)",
            (subsidiary, info.get("primary", ""), info.get("secondary", ""), info.get("minted_allocation", "[PENDING]"))
        )
    conn.commit()
    print(f"[OK] Backing registry seeded: {len(registry.get('subsidiary_backing', {}))} subsidiaries")

def seed_atm_nodes(conn):
    nodes_json = Path("C:/Users/young/agents/corporate_runtime/documents/crypto_treasury/atm_node_configs/regional_nodes.json")
    if not nodes_json.exists():
        print("[SKIP] ATM nodes JSON not found")
        return
    with open(nodes_json, "r") as f:
        data = json.load(f)
    cursor = conn.cursor()
    for node in data.get("nodes", []):
        cursor.execute(
            "INSERT OR REPLACE INTO atm_nodes (node_id, region, city, status, fiat_pair, liquidity_reserve_usd, operator, settlement_protocol) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (node["node_id"], node["region"], node["city"], node["status"], node["fiat_pair"],
             node.get("liquidity_reserve_usd", "[PENDING]"), node.get("operator", "[PENDING]"),
             node.get("settlement_protocol", "Time-Locked Proof-of-Trade"))
        )
    conn.commit()
    print(f"[OK] ATM nodes seeded: {len(data.get('nodes', []))} nodes")

def verify_integrity(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM treasury_reserves")
    reserves = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM atm_nodes")
    nodes = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM backing_assets")
    backing = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM settlement_transactions")
    txs = cursor.fetchone()[0]
    print(f"[VERIFY] reserves={reserves}, atm_nodes={nodes}, backing_assets={backing}, transactions={txs}")
    return reserves, nodes, backing, txs

def main():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    init_schema(conn)
    migrate_legacy_ledger(conn)
    seed_backing_registry(conn)
    seed_atm_nodes(conn)
    verify_integrity(conn)
    conn.close()
    print(f"[DONE] Ledger database at {DB_PATH}")

if __name__ == "__main__":
    main()
