# Aura Champions — Operator Reference

AR trading-card battler. Physical NTAG216 cards are tapped to summon monsters,
trigger Trinity convergence combos (#50 / #75 / #100 + Convergence Stone), and
enter judged tournaments. Architecture is **Hermes-native** (NOT Agent Zero).

## Skill Map (Hermes, auto-discovered)

| Skill | Domain | Trigger |
|---|---|---|
| `aura-champions` | Meta / orchestrator | project coordination, end-to-end flows |
| `aura-backend-master` | Backend | PostgreSQL schema, REST API, battle sync, anti-cheat design |
| `aura-ue-client` | UE Client | UE 5.7 C++, Blueprint, NFC tap, AR/Trinity VFX |
| `aura-nfc-handler` | NFC | NTAG216 memory map, Android/iOS bridges, write-token, fusion |
| `aura-anti-cheat` | Anti-cheat | HMAC auth, single-use nonce, tamper-evident audit, judge proof |
| `aura-trinity-special` | Trinity | convergence validation, event emission, effects |
| `aura-tournament-admin` | Tournament | judge tools, deck legality, match log, sideboard |

All skills live in two trees:
- Project: `C:/Users/young/agents/hermes_skills/`
- Active profile: `C:/Users/young/AppData/Local/hermes/skills/`
- Routed via `SOUL.md` (Aura Champions section, under game-design subsidiary).

## Data Flow

```
Card tap (NFC) -> client snapshot -> POST /registerCard (backend)
  -> checksum verify vs card_registry
Battle action -> HMAC sign + server nonce -> POST /battleSync
  -> authoritative resolution -> event list -> client animates
Trinity -> 3 monsters alive + stone -> TRINITY_ACTIVATED event -> VFX
Tournament -> judge verification token -> signed proof (no raw registry)
```

## Source of Truth (runtime root)

`C:/Users/young/agents/corporate_runtime/documents/game_design/`
- `ue5_project/` — AuraClient plugin + project files
- `cpp_scripts/` — UE C++ source
- `mechanics_docs/server_services/` — backend / anti-cheat / trinity / tournament / nfc services
- `level_maps/`, `system_profiling/`, `legal_reference/`

The UE5 plugin is integrated into:
`C:/Users/young/STILLALIVE ARCADE/Stillalivetopia/Plugins/AuraClient/`
(registered in `Stillalivetopia.uproject`).

## CLASS-1 / Data Sovereignty

- Never expose raw registry data or signed proofs to external endpoints.
- Provide judge-facing commands / signed proof tokens instead.
- Legal reference is read-only.

## How to Run (services)

Services are containerized via `docker-compose.yml` (5 services: backend,
write-token, anti-cheat, trinity-special, tournament-admin + Postgres).
Requires Docker daemon running:

```
docker compose up --build
```

Then exercise endpoints via the Postman collections in each skill's `examples/`
or `postman/` dir. Set collection vars: `baseUrl`, `port_backend` (3000),
`port_anticheat` (3001), `port_trinity` (3002), `port_tournament` (3003),
`port_nfc` (4000).

## Packages

Hermes-format zips: `C:/Users/young/agents/hermes_skills/_packages/`
- `aura-champions-hermes-all.zip` — all 7 skills (91 entries)
- per-skill zips: `aura-backend-master.zip`, `aura-ue-client.zip`, etc.

## Validation

A weekly cron job runs `node --check` across every `.js` in the skills and
reconciles file counts against the runtime root. Drift is reported, not silently fixed.

## Legacy Note

The Agent Zero-layout trees under `C:/Users/young/stacks/multiagent/_legacy_agentzero_aura/`
are deprecated archives. Do not route tasks there.
