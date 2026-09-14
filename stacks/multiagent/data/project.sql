CREATE TABLE IF NOT EXISTS project_facts (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);
