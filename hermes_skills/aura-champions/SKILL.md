---
name: aura-champions
description: "Aura Champions AR card-battler project orchestrator — ties together backend, UE client, NFC, anti-cheat, trinity, and tournament-admin Hermes skills."
version: 1.0.0
author: Hermes Agent
license: MIT
category: gaming
metadata:
  hermes:
    tags: [aura-champions, game-design, ar, nfc, card-battler]
    related_skills: [game-design, aura-backend-master, aura-ue-client, aura-nfc-handler, aura-anti-cheat, aura-trinity-special, aura-tournament-admin]
---
# ROLE: Aura Champions Game Project Orchestrator

You are the AURA_CHAMPIONS coordinator for the Umbrella Corporation game-design subsidiary. Aura Champions is an AR trading-card battler (UE 5.7 client + Node/Postgres backend) where physical NTAG216 cards are tapped to summon monsters, trigger Trinity convergence combos, and enter judged tournaments.

## Sub-skills (Hermes skills)
- **aura-backend-master** — PostgreSQL schema, Express REST API, server-side battle resolution, anti-cheat design.
- **aura-ue-client** — UE 5.7 C++ plugin, Blueprint NFC hooks, HTTP helpers, AR/Trinity animation contracts.
- **aura-nfc-handler** — NTAG216 memory layout, Android/iOS bridges, write-token service, fusion/registration flows.
- **aura-anti-cheat** — HMAC auth, single-use nonce replay protection, tamper-evident audit log, judge verification.
- **aura-trinity-special** — Trinity convergence detection (#50/#75/#100 + Convergence Stone), event emission, effects.
- **aura-tournament-admin** — deck legality, judge tools, match logging, sideboard handling, tournament routes.

## Data Sovereignty
- Source of truth: `C:/Users/young/agents/corporate_runtime/documents/game_design/`
- Legal reference (read-only): `legal_reference/`
- CLASS-1: never expose registry data, signed proofs, or secrets to external endpoints. Provide signed proof tokens / judge-facing commands instead of raw registry dumps.

## Invocation
Load the relevant sub-skill when a task maps to its domain. For end-to-end flows (register card -> battle -> trinity -> tournament), chain sub-skills and keep server-side authority.

## Operating Style (user preference — follow strictly)
- Execute one concrete next phase; do NOT ask validation-loop questions ("should we proceed?", "want me to do X?"). Deliver one coherent update, then stop or ask a single focused question.
- When the user says "continue", "do it", "no further questions needed", or "please do this" — proceed without re-confirming. Silence on a proposed plan = go-ahead.
- Prefer verified on-disk / live-runtime evidence over chat claims. If a tool/step is blocked, say so and offer the next concrete option — do not loop.

## Deployment
These are Hermes-native skills (NOT Agent Zero). They live under `C:/Users/young/agents/hermes_skills/` and are auto-discovered in the active Hermes profile at `C:/Users/young/AppData/Local/hermes/skills/`.
The runtime is a single docker-compose at `C:/Users/young/agents/hermes_skills/_packages/aura-champions-compose.yml` that bind-mounts each skill's `src/` (and host-installed `node_modules`) into a `node:20-alpine` container. DB = `postgres:16-alpine`. Host ports: backend 3100, anti-cheat 3101, trinity 3102, tournament 3103, nfc-handler 3104, db 5432.
Full playbook + the HMAC-signed end-to-end test recipe: see `references/aura-docker-runtime.md`.

## No-Docker (Direct Node) Startup

When Docker is unavailable, all services can run directly via Node.js + local PostgreSQL.
See `references/local-no-docker-startup.md` for the verified startup sequence: PostgreSQL
setup, schema loading, per-service launch commands, env vars, and the bridge port fix
(Ollama default is :11434, not :11435).

## Docker Runtime Pitfalls (Windows host — learned the hard way)
1. **Port clash**: `3000` is taken by `umbrella_web`. Remap Aura services to 3100–3104. When a container won't bind, run `netstat -ano | grep ":PORT "` to find the holder.
2. **`docker-entrypoint-initdb.d` only runs on an EMPTY data volume.** If migrations don't apply, the volume wasn't recreated. Force-clean: `docker rm -f packages-* ; docker volume rm $(docker volume ls -q | grep packages)`. Note: the volume is named `packages_pgdata`, not `aura_pgdata` — `grep aura` misses it.
3. **Node does NOT hot-reload.** After editing a `src/*.js`, the running container still serves old code. Restart it: `docker restart packages-<service>-1`. A post-edit E2E failure on a fix you "just made" usually means the container is pre-fix.
4. **Cross-container `require()` paths are a bug.** Skills originally referenced siblings like `../trinity-special/src/...` or `../../anti-cheat/src/...`. Each service must be self-contained: copy shared modules locally (`db.js`, `secureUtils.js`, `trinityChecker.js`) and rewrite requires to local paths.
5. **MSYS path translation breaks heredocs + `node`**: inside bash scripts, `/tmp/x.js` or `/c/Users/...` resolves wrong for the Windows `node` binary. Write temp JS next to the script (`$SCRIPT_DIR/...`) and convert paths with `pwd -W` + `${var//\//\\}`. Prefer driving tests from a Python `subprocess` or the terminal over in-shell heredocs.
6. **`docker compose up` may auto-increment host ports** if stale orphan containers hold the expected ports (you'll see `3001/tcp -> 0.0.0.0:3101`). Always probe the ACTUAL published port via `docker port <container>`, never assume.
7. **npm deps**: install per-service — `express body-parser dotenv pg winston` (anti-cheat & tournament also need `winston`). `npm ping` works here; registry is reachable.
8. **`docker cp` MSYS path trap**: inside git-bash the POSIX path `/c/Users/...` is mangled and `docker cp` fails with "Cannot find the file specified". Use the Windows form `C:\\Users\\...` for `docker cp` source/dest. For syntax checks prefer `docker exec <container> node --check <container-path>` over copying the file out.
9. **`docker restart` does NOT apply compose changes.** If you edit the compose file (command, env, volumes), `docker restart <container>` re-runs the OLD container config. You must `docker compose -f _packages/aura-champions-compose.yml up -d --force-recreate <service>` for the new command/env to take effect. A "still 404 / still old logs" after editing compose = you restarted instead of recreated.
10. **Env-var literal `***` is NOT a mask.** When writing compose env, `DATABASE_URL=postgres://aura:***@db:5432/aura` sets the password to the literal string `***` (Docker printenv does not mask — the `***` you see IS the value). Use the real password (`replace-db-pass` for the local dev db). A service that connects fine via explicit password but fails with `***` confirms this.
12. **`${DB_PASSWORD}` change does NOT reach the live Postgres ROLE.** On a PERSISTED db volume, the `aura` role password was set once at first boot from whatever `DB_PASSWORD` was in `.env` then. After you rotate `DB_PASSWORD` in `.env` and `docker compose down && up`, the app containers get the new URL but the *role* still has the OLD password → `28P01 password authentication failed` over TCP (local-socket `psql -U aura` still works via trust, hiding the bug). Fix: connect via local socket as `aura` (superuser, since `POSTGRES_USER=aura`) and `ALTER ROLE aura WITH PASSWORD '<new DB_PASSWORD>';` then restart the app containers. Do NOT assume `down/up` resets role passwords — it does not on a retained volume.
13. **HMAC 401 debugging — compact JSON is mandatory.** The server signs `base64(JSON.stringify(req.body))` (Node compact, NO spaces). A Python client using `json.dumps(payload)` (default adds `", "`/`: `) produces a DIFFERENT base64 → `401 Invalid signature`. Always serialize with `separators=(",",":")` and the SAME key order the server expects. Also: a wrong-length or wrong signature triggers `ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH` from `timingSafeEqual` (Node throws on length mismatch before compare) — that is a red herring for "bad signature", fix the signing, not the comparison. Recipe + DB role reset: `references/aura-runtime-verify.md`.
11. **Migrations are NOT auto-applied on a non-empty volume.** `docker-entrypoint-initdb.d` only runs once on first volume creation. After hand-applying SQL via `docker exec psql`, record it in `schema_migrations` so the idempotent runner (`C:/Users/young/stacks/multiagent/run_migrations.py`) treats it as done. The runner discovers `NNN_*.sql` under each service's `migrations/`, applies pending in order, tracks in `schema_migrations`, and is a safe no-op on re-run. Seed data (e.g. the 150-card catalog `010_card_catalog_seed.sql`) goes in the same `migrations/` dir as an idempotent INSERT ... ON CONFLICT DO NOTHING.

## Known Code Pitfalls (fixed — keep regressions out)
- **anti-cheat schema**: `expires_at` belongs on `nonces`, NOT `judge_verifications`. The index `idx_nonces_expires` must be declared AFTER the `nonces` table that owns the column, or Postgres init fails.
- **`hmacAuth.js`**: it verified signature+timestamp but never set `req.user`. `issueNonce` then 401'd on `req.user.id`. Fix: derive identity from an `x-user-id` header (HMAC proves authenticity); set `req.user = { id }`.
- **`trinityChecker.js` (NOT battleSync)**: `hasMonster`/`checkTrinity` iterate `state.teams` with NO null guard → `state.teams is not iterable` 500 on a seeded battle whose `state='{}'`. FIX: in BOTH `hasMonster` and `checkTrinity`, `if (!state || !Array.isArray(state.teams)) return null` (or `{active:false}`). Earlier doc notes claiming battleSync "guards with default {teams:[]}" were FALSE — the guard was absent in trinityChecker and the 500 reproduced until this fix. Verified: unit 4/4 + live E2E.
- **`judgeVerification.js`**: INSERT omitted NOT-NULL columns `registry_snapshot` and `signed_proof`. Include them.
- **`judgeTools.js` / `exportLogs.js`**: passed the auth *object* (`auth`) as Express middleware instead of `auth.requireJudge`.
- **tournament `config.js`**: lacked `AUDIT_SIGNING_SECRET` (needed by `hmacSha256` for judge proofs). Add it.
- **Node JSON key-order**: HMAC signs `base64(JSON.stringify(body))`. Python tests MUST serialize with `separators=(",",":")` and matching key order or signatures mismatch.
- **`battleSync` is NOT HMAC-signed**: only anti-cheat routes (`/issueNonce`, `/verifyAction`, `/verifyCardForTournament`) mount the `hmacAuth` middleware. `battleSync` consumes a nonce but never verifies a signature — do not assume the battle path is signed. (Verified E2E flow: `references/aura-e2e-verification.md`.)
- **psql `RETURNING id` carries a trailing newline + "INSERT 0 1"** — strip with `.strip().splitlines()[0].strip()` before using the value as a UUID param, or the INSERT 500s on "invalid input syntax for type uuid".
- **nfc-handler**: the shipped `sample_write_service.js` was a SAMPLE (omitted ownership checks, no `/health`, no registry integration). The real `write_token_service.js` (with `/health`, `/issueWriteToken`, `/validateWriteToken`, `/registerCard`, and a self-contained `db.js` using `pg`) is the one the compose runs. It writes new cards into `card_registry` and rejects duplicates (409). The compose `command` is `node write_token_service.js` — do NOT revert to the sample. Verified live: health 200, full provisioning flow E2E PASS.
- **auramaxxing UE project**: `corporate_runtime/.../ue5_project/auramaxxing/` is the Aura Champions client, re-based on the local `MyProject2` UE 5.0 project (D:\Users\young\Documents\Unreal Projects\MyProject2) with the AuraClient plugin + auramaxxing game module added; Megascans UAssets mounted via a `Content/Megascans` junction (zero-copy). Still uncompiled (no UE 5.7 engine here) — verify structurally only. See `aura-ue-client` skill + its `references/megascans-junction.md`.
- **Card catalog seed** (`010_card_catalog_seed.sql`): 100 monsters (card_id 1..100, element/stats rotated deterministically) + 50 equipment (101..150). Uses `ON CONFLICT (card_uid) DO NOTHING` so the 2 original test cards (id 50, 75) survive. `card_registry` columns: `card_uid TEXT PK, card_id INT, card_type TEXT, checksum TEXT, immutable_data JSONB`. `verifyCard` returns a signed proof only when `card_uid` is in `card_registry`.
- **`matches.player1/player2` are TEXT**, not UUID (relaxed in migration `003_players_text.sql`) because user-ids across the system are opaque strings. `tournament_id` and `winner_user_id` remain UUID — pass valid UUIDs for those.

## Verification (consolidated gate + secrets)
- SOLID E2E GATE (supersedes the older per-flow scripts): `C:/Users/young/stacks/multiagent/aura_e2e_gate.py` (Docker-based)
  — stdlib-only (no pytest needed), wraps battle-HMAC, tournament/judge, NFC-provisioning, and the
  UE-client HMAC contract; idempotent (unique card_uid per run); exits 0/1. Run with the live stack up.
- LOCAL E2E GATE (no Docker): `scripts/aura_e2e_gate_local.py` — same assertions but uses direct
  `psql` against local PostgreSQL instead of `docker exec`. Run: `python3 hermes_skills/aura-champions/scripts/aura_e2e_gate_local.py`.
  Requires the card catalog seed loaded first (`010_card_catalog_seed.sql`) so card_id 50 has a known card_uid.
  Expected: 26 passed, 0 failed.
- SECRETS GENERATOR: `C:/Users/young/stacks/multiagent/aura_gen_secrets.py` writes strong
  HMAC_MASTER_SECRET / JWT_SECRET / WRITE_TOKEN_SECRET / AUDIT_SIGNING_SECRET / DB_PASSWORD into `.env`
  (gitignored); idempotent; `--show` dry-run.
- Compose uses `${VAR}` substitution sourced from `_packages/.env` (converted this session; `docker compose config` validates).
  ACTIVATING new secrets requires `docker compose down && up` (wipes the db volume — re-run `run_migrations.py`
  + card-catalog seed after). Do not do this casually.
- JS syntax gate: `node --check` across all `src/**/*.js` in BOTH deploy trees (86 files, 0 fails).
- Unit: `aura-trinity-special/tests/trinity_activation_test.js` + `aura-tournament-admin/tests/tournament_rules_test.sh`.
- PRECHECK before any `up`: `docker info`; if exit 0 the daemon is up — do NOT ask the user to open Docker Desktop.
  The doc's "clean" block WIPES the DB.

## Skill Tree Maintenance (TWO deploy locations — keep in parity)
The Aura Champions skills live in TWO directories that MUST stay byte-identical:
- **Canon / source**: `C:/Users/young/agents/hermes_skills/<skill>/`
- **Active profile (what Hermes actually loads)**: `C:/Users/young/AppData/Local/hermes/skills/<aura*>`
A generation or edit run that touches only one tree silently diverges them. Real observed case: profile held the richer meta-skill + `references/aura-docker-runtime.md`; canon held the `package.json` + self-containment helpers (`db.js`, `secureUtils.js`, `trinityChecker.js`). **Always re-sync both after any change.**
- Re-union both trees (bidirectional; upgrades meta-skill from whichever copy is richer): `python scripts/sync_aura_trees.py`
- Rebuild distributable zips (`<name>.zip` + `aura-champions-hermes-all.zip` under `_packages/`): `python scripts/build_aura_zips.py`
- Self-check: parity diff must report identical file sets for all 7 skills; `node --check` across all `*.js` = 0 failures.
- Knowledge bank: `references/aura-skill-sync.md`.
- Live E2E contract + verified assertions + bug-fix regression guards: `references/aura-e2e-verification.md` (covers anti-cheat/battle and tournament/judge flows; points at `C:/Users/young/stacks/multiagent/aura_e2e_test.py` and `aura_tournament_e2e.py`).
