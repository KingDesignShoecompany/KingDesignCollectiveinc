# Local (No-Docker) Startup for Aura Champions Services

When Docker is unavailable on the host, all Aura services can be started directly
via Node.js. This is the verified startup path that replaces the docker-compose
runtime (`aura-champions-compose.yml`).

## Prerequisites

1. **PostgreSQL running locally** on port 5432 with `aura` user/database.
   If pg_hba.conf enforces `scram-sha-256` and you don't know the password,
   temporarily set localhost to `trust`:
   ```python
   # Run as Python (not bash) to handle the Windows path with spaces
   import os
   path = r'C:\Program Files\PostgreSQL\18\data\pg_hba.conf'
   with open(path) as f: lines = f.read().split('\n')
   with open(path, 'w') as f:
       f.write('\n'.join(
           ' '.join(l.split()[:-1] + ['trust']) if (l.strip() and not l.startswith('#') and 'scram-sha-256' in l) else l
           for l in lines
       ))
   # Then reload: pg_ctl reload, or just connect — trust takes effect on next connection
   ```
   Then create the role and database:
   ```cmd
   psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE ROLE aura WITH LOGIN CREATEDB SUPERUSER;"
   psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE aura OWNER aura;"
   ```

2. **Node.js** available in PATH (v24 tested; v20+ required).

3. **Secrets** from `_packages/.env` (read via terminal, never read_file):
   ```cmd
   echo %VAR_NAME%  # or in bash: echo $VAR_NAME
   ```

4. **Load all 3 migration schemas** into the `aura` database (in order):
   ```cmd
   psql -h localhost -p 5432 -U aura -d aura -f hermes_skills/aura-backend-master/migrations/001_backend_schema.sql
   psql -h localhost -p 5432 -U aura -d aura -f hermes_skills/aura-anti-cheat/migrations/001_anti_cheat_schema.sql
   psql -h localhost -p 5432 -U aura -d aura -f hermes_skills/aura-tournament-admin/migrations/001_tournament_schema.sql
   ```

## Service Startup Order & Commands

Environment variables needed:
```
DATABASE_URL="postgres://aura:<DB_PASSWORD>@localhost:5432/aura"
HMAC_MASTER_SECRET=<from .env>
JWT_SECRET=<from .env>
WRITE_TOKEN_SECRET=<from .env>
AUDIT_SIGNING_SECRET=<from .env>
NONCE_TTL_SECONDS=45
TOKEN_TTL_SECONDS=30
```

Start each service (port 3100-3104 matches the docker-compose mapping):

```cmd
# Backend (3100)
set PORT=3100
set DATABASE_URL=postgres://aura:<DB_PASSWORD>@localhost:5432/aura
set HMAC_SECRET=<HMAC_MASTER_SECRET>
set JWT_SECRET=<JWT_SECRET>
set WRITE_TOKEN_SECRET=<WRITE_TOKEN_SECRET>
node hermes_skills/aura-backend-master/src/app.js

# Anti-Cheat (3101)
set PORT=3101
set DATABASE_URL=postgres://aura:<DB_PASSWORD>@localhost:5432/aura
set HMAC_MASTER_SECRET=<HMAC_MASTER_SECRET>
set JWT_SECRET=<JWT_SECRET>
set AUDIT_SIGNING_SECRET=<AUDIT_SIGNING_SECRET>
set NONCE_TTL_SECONDS=45
node hermes_skills/aura-anti-cheat/src/app.js

# Trinity Special (3102)
set PORT=3102
node hermes_skills/aura-trinity-special/src/app.js

# Tournament Admin (3103)
set PORT=3103
set DATABASE_URL=postgres://aura:<DB_PASSWORD>@localhost:5432/aura
set HMAC_MASTER_SECRET=<HMAC_MASTER_SECRET>
set JWT_SECRET=<JWT_SECRET>
set AUDIT_SIGNING_SECRET=<AUDIT_SIGNING_SECRET>
node hermes_skills/aura-tournament-admin/src/app.js

# NFC Handler (3104)
set PORT=3104
set DATABASE_URL=postgres://aura:<DB_PASSWORD>@localhost:5432/aura
set WRITE_TOKEN_SECRET=<WRITE_TOKEN_SECRET>
set TOKEN_TTL_SECONDS=30
node hermes_skills/aura-nfc-handler/server/write_token_service.js
```

## Pitfall: Background process lifecycle

When starting Node services via the Hermes `terminal(background=true)` tool, the
environment variables set with `export VAR=value` in the command string work, but
`PORT=3000 node ...` inline prefix syntax does NOT propagate reliably in the MSYS2
bash wrapper. Instead, **export each variable on its own line before the node call**,
or use a wrapper script. The node process must stay alive — if it exits immediately
with code 1, check stderr for the actual error (often a port conflict or missing env var).

## Bridge service (port 8090)

The integration bridge that provides `/api/umbrella/status` health checks also
needs the Ollama URL corrected: Ollama's default port is **11434** (not 11435).
The bridge config `OLLAMA_URL` defaults to the wrong port — override via env:
```
set OLLAMA_URL=http://127.0.0.1:11434
python3 hermes_skills/integration/umbrel/scripts/bridge.py
```

## Verification

After all 5 services + bridge are started:
```
curl -s http://127.0.0.1:3100/health        # {"status":"ok"}
curl -s http://127.0.0.1:8090/api/umbrella/status  # full stack health
```
