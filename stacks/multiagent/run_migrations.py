#!/usr/bin/env python3
"""
Aura Champions migration runner (idempotent).
- Discovers *.sql under each skill's migrations/ dir.
- Applies pending migrations in numeric-prefix order.
- Tracks applied filenames in schema_migrations (created if absent).
- Safe to re-run: already-applied files are skipped.
Usage:
  python run_migrations.py            # apply against live stack (docker exec psql)
  python run_migrations.py --check    # list pending without applying
"""
import os, re, subprocess, sys, argparse

ROOT = r"C:/Users/young/agents/hermes_skills"
SERVICES = ["aura-anti-cheat", "aura-backend-master", "aura-tournament-admin"]
# migrations that live in backend-master but apply cross-service are all included.
MIGRATION_DIRS = [os.path.join(ROOT, s, "migrations") for s in SERVICES]
DB_CONTAINER = "packages-db-1"
DB_CMD = ["docker", "exec", DB_CONTAINER, "psql", "-U", "aura", "-d", "aura", "-v", "ON_ERROR_STOP=1", "-q"]

def discover():
    found = []
    pat = re.compile(r"^(\d+)_(.+)\.sql$")
    for d in MIGRATION_DIRS:
        if not os.path.isdir(d):
            continue
        for f in sorted(os.listdir(d)):
            m = pat.match(f)
            if not m:
                continue
            found.append((int(m.group(1)), f, os.path.join(d, f)))
    found.sort(key=lambda x: (x[0], x[1]))
    return found

def ensure_tracking_table():
    sql = ("CREATE TABLE IF NOT EXISTS schema_migrations ("
           "id SERIAL PRIMARY KEY, filename TEXT UNIQUE NOT NULL, "
           "applied_at TIMESTAMP WITH TIME ZONE DEFAULT now());")
    r = subprocess.run(DB_CMD + ["-c", sql], capture_output=True, text=True)
    if r.returncode != 0:
        print("FATAL creating schema_migrations:", r.stderr); sys.exit(1)

def applied_set():
    r = subprocess.run(DB_CMD + ["-t", "-c", "SELECT filename FROM schema_migrations;"],
                       capture_output=True, text=True)
    return set(l.strip() for l in r.stdout.splitlines() if l.strip())

def apply(fname, path):
    # copy then run inside container so psql reads a clean path
    dst = f"/tmp/{fname}"
    subprocess.run(["docker", "cp", path.replace("\\", "/"), f"{DB_CONTAINER}:{dst}"],
                   capture_output=True, text=True)
    r = subprocess.run(DB_CMD + ["-f", dst], capture_output=True, text=True)
    if r.returncode != 0:
        print(f"  FAIL {fname}:\n{r.stderr}")
        return False
    subprocess.run(DB_CMD + ["-c", f"INSERT INTO schema_migrations(filename) VALUES ('{fname}') ON CONFLICT DO NOTHING;"],
                   capture_output=True, text=True)
    return True

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="list pending only")
    args = ap.parse_args()

    ensure_tracking_table()
    all_m = discover()
    done = applied_set()
    pending = [m for m in all_m if m[1] not in done]

    print(f"Discovered {len(all_m)} migrations; {len(done)} already applied; {len(pending)} pending.")
    if not pending:
        print("Nothing to apply. Database is up to date.")
        return
    if args.check:
        for _, fn, _ in pending:
            print(f"  PENDING {fn}")
        return
    for _, fn, path in pending:
        print(f"  applying {fn} ...", end=" ", flush=True)
        ok = apply(fn, path)
        print("OK" if ok else "ERROR")
        if not ok:
            print("Aborting on first failure."); sys.exit(1)
    print("Migrations complete.")

if __name__ == "__main__":
    main()
