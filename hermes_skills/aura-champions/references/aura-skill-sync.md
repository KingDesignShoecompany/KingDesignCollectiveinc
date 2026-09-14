# Aura Champions — Skill Tree Parity & Maintenance

## Why this exists
Aura Champions is deployed to TWO skill directories that must remain byte-identical:
- Canon/source: `C:/Users/young/agents/hermes_skills/<skill>/`
- Active profile (Hermes auto-discovers this): `C:/Users/young/AppData/Local/hermes/skills/<aura-*>`

The conversion pipeline (`stacks/multiagent/convert_aura_to_hermes.py`) writes to BOTH, but it
references an outdated source path (`stacks/multiagent/agent_zero_usr/skills`) and its EXCLUDE
set drops `node_modules` while leaving `package.json` — so a stale or partial run leaves the
two trees holding different subsets of files. That is exactly what happened: profile had the
richer meta-skill + `references/`, canon had the self-containment helper src.

## Symptoms of divergence
- Dir-count shows different file totals per skill between the two trees.
- One tree's `aura-champions/SKILL.md` is larger/richer than the other.
- A service imports a local module (`db.js`, `secureUtils.js`, `trinityChecker.js`) that only
  exists in one tree → docker runtime 500s even though "the file is there".

## Fix recipe (verified)
1. Compute symmetric file diff per skill (exclude `.git`, `__pycache__`, `node_modules`).
2. Copy the union both ways (file additions only; never delete).
3. Upgrade the meta-skill `SKILL.md` in canon from the richer profile copy.
4. Gate: `node --check` all `*.js` (must be 0 failures), then parity diff (must be identical).
5. Rebuild zips so `_packages/` matches.

## Hard rules (don't regress)
- Never run `convert_aura_to_hermes.py` against the legacy `agent_zero_usr` path — it's stale;
  use `scripts/sync_aura_trees.py` for reconciliation instead.
- Each service MUST be self-contained: local `db.js`, `secureUtils.js`, `trinityChecker.js`
  under its own `src/`. No cross-container `require('../../sibling/...')`.
- Keep `package.json` (deps: express body-parser dotenv pg winston; nfc-handler uses
  crypto, not winston) in every service tree so docker `node:20-alpine` bind-mounts resolve deps.
