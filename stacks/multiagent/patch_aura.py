import os, shutil, zipfile

BASES = [
    r"C:/Users/young/stacks/multiagent/agent_zero_usr/skills",
    r"C:/Users/young/a0_usr/skills",
]
SKILLS = ["backend-master","ue-client","nfc-handler","anti-cheat","trinity-special","tournament-admin"]
ROOT_FILES = ["deploy_skills.sh","deploy_skills.bat","docker-compose.yml",".env.example"]
ROOT_DIRS = ["systemd"]

# --- Fix 1: schema missing expires_at column ---
SCHEMA_OLD = """  used BOOLEAN DEFAULT FALSE,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);"""
SCHEMA_NEW = """  used BOOLEAN DEFAULT FALSE,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);"""

# --- Fix 2: nonceCheck missing expiration check ---
NC_OLD = """  if (row.issued_to && row.issued_to.toString() !== userId) return res.status(403).json({ error: 'Nonce-user mismatch' });

  // Mark nonce consumed"""
NC_NEW = """  if (row.issued_to && row.issued_to.toString() !== userId) return res.status(403).json({ error: 'Nonce-user mismatch' });
  if (row.expires_at && new Date(row.expires_at) < new Date()) return res.status(403).json({ error: 'Nonce expired' });

  // Mark nonce consumed"""

COMPOSE = """version: '3.8'

services:
  backend:
    image: node:20-alpine
    working_dir: /usr/src/app
    volumes:
      - ./backend-master:/usr/src/app
      - ./nfc-handler/server:/usr/src/write-token
    environment:
      - PORT=3000
      - DATABASE_URL=postgres://aura:***@db:5432/aura
      - JWT_SECRET=replace-jwt-secret
      - HMAC_SECRET=replace-with-strong-secret
      - HMAC_MASTER_SECRET=replace-with-strong-secret
      - AUDIT_SIGNING_SECRET=replace-audit-secret
      - WRITE_TOKEN_SECRET=replace-with-strong-secret
      - NONCE_TTL_SECONDS=45
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy
    command: >
      sh -c "cd /usr/src/app && npm install --production && node src/app.js"

  write-token-service:
    image: node:20-alpine
    working_dir: /usr/src/app
    volumes:
      - ./nfc-handler/server:/usr/src/app
    environment:
      - PORT=4000
      - WRITE_TOKEN_SECRET=replace-with-strong-secret
    ports:
      - "4000:4000"
    depends_on:
      db:
        condition: service_healthy
    command: >
      sh -c "npm install --production && node sample_write_service.js"

  anti-cheat:
    image: node:20-alpine
    working_dir: /usr/src/app
    volumes:
      - ./anti-cheat:/usr/src/app
    environment:
      - PORT=3001
      - DATABASE_URL=postgres://aura:***@db:5432/aura
      - HMAC_MASTER_SECRET=replace-with-strong-secret
      - JWT_SECRET=replace-jwt-secret
      - AUDIT_SIGNING_SECRET=replace-audit-secret
      - NONCE_TTL_SECONDS=45
    ports:
      - "3001:3001"
    depends_on:
      db:
        condition: service_healthy
    command: >
      sh -c "npm install --production && node src/app.js"

  trinity-special:
    image: node:20-alpine
    working_dir: /usr/src/app
    volumes:
      - ./trinity-special:/usr/src/app
    environment:
      - PORT=3002
      - DATABASE_URL=postgres://aura:***@db:5432/aura
      - HMAC_MASTER_SECRET=replace-with-strong-secret
      - JWT_SECRET=replace-jwt-secret
      - NONCE_TTL_SECONDS=45
    ports:
      - "3002:3002"
    depends_on:
      db:
        condition: service_healthy
    command: >
      sh -c "npm install --production && node src/app.js"

  tournament-admin:
    image: node:20-alpine
    working_dir: /usr/src/app
    volumes:
      - ./tournament-admin:/usr/src/app
    environment:
      - PORT=3003
      - DATABASE_URL=postgres://aura:***@db:5432/aura
      - HMAC_MASTER_SECRET=replace-with-strong-secret
      - JWT_SECRET=replace-jwt-secret
      - AUDIT_SIGNING_SECRET=replace-audit-secret
      - NONCE_TTL_SECONDS=45
    ports:
      - "3003:3003"
    depends_on:
      db:
        condition: service_healthy
    command: >
      sh -c "npm install --production && node src/app.js"

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=aura
      - POSTGRES_PASSWORD=replace-db-pass
      - POSTGRES_DB=aura
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./anti-cheat/migrations/001_anti_cheat_schema.sql:/docker-entrypoint-initdb.d/001_anti_cheat_schema.sql
      - ./backend-master/migrations/001_backend_schema.sql:/docker-entrypoint-initdb.d/002_backend_schema.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aura -d aura"]
      interval: 2s
      timeout: 3s
      retries: 10

volumes:
  pgdata:
"""

def arc(fp, base):
    return os.path.relpath(fp, base).replace("\\", "/")

for base in BASES:
    print("=== base:", base)
    # Fix 1
    sp = os.path.join(base, "anti-cheat", "migrations", "001_anti_cheat_schema.sql")
    s = open(sp, encoding="utf-8").read()
    if "expires_at TIMESTAMP WITH TIME ZONE\n);" not in s:
        s2 = s.replace(SCHEMA_OLD, SCHEMA_NEW)
        assert s2 != s, "schema replace failed"
        open(sp, "w", encoding="utf-8").write(s2)
        print("  schema patched")
    else:
        print("  schema already patched")
    # Fix 2
    np = os.path.join(base, "anti-cheat", "src", "middleware", "nonceCheck.js")
    s = open(np, encoding="utf-8").read()
    if "Nonce expired" not in s:
        s2 = s.replace(NC_OLD, NC_NEW)
        assert s2 != s, "nonceCheck replace failed"
        open(np, "w", encoding="utf-8").write(s2)
        print("  nonceCheck patched")
    else:
        print("  nonceCheck already patched")
    # Remove stray temp file
    tmp = os.path.join(base, "trinity-special", ".hermes-tmp.a6wLXE")
    if os.path.exists(tmp):
        os.remove(tmp)
        print("  removed temp file")
    # Rewrite docker-compose
    open(os.path.join(base, "docker-compose.yml"), "w", encoding="utf-8").write(COMPOSE)
    print("  docker-compose rewritten")
    # Complete aura-validation: sync all 6 skills
    av = os.path.join(base, "aura-validation")
    for sk in SKILLS:
        src = os.path.join(base, sk)
        dst = os.path.join(av, sk)
        if os.path.isdir(src):
            if os.path.isdir(dst):
                shutil.rmtree(dst)
            shutil.copytree(src, dst)
    print("  aura-validation synced")

print("PATCH STAGE DONE")
