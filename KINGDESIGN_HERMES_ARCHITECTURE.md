# KingDesignCollectiveINC Corporation: Hermes-Native Architecture

## Executive Summary
Run the entire KingDesignCollectiveINC Corporation stack through **Hermes Agent** (Nous Research) connected to a local **Ollama** backend. Each business subsidiary is a first-class **Hermes Skill**. Daily operations, content pipelines, and treasury logic are executed via **delegated subagents**, **cron jobs**, and **persistent memory** — no custom agent framework required.

---

## 1. Why Hermes Instead of Agent Zero

| Dimension | Agent Zero | Hermes Agent |
|---|---|---|
| Orchestration | Custom master router + sub-agents | Built-in `delegate_task` + leaf/orchestrator roles |
| Skills | Manual prompt files | Open standard `SKILL.md` with references/, templates/, scripts/ |
| Memory | FAISS indexes | FTS5 + LLM summarization + Honcho dialectic modeling |
| Scheduling | Manual container init | Built-in cron with platform delivery |
| Platforms | Web UI only | CLI, Telegram, Discord, Slack, WhatsApp, Signal, etc. |
| Isolation | Docker socket proxy | Host sandboxing + optional Docker backend |
| Self-improvement | None | Autonomous skill creation/updates from experience |

**Strategic advantage:** Hermes eliminates the custom orchestration code you would have had to write for Agent Zero. The skills system, delegation, and memory are production-ready.

---

## 2. Topology

```
[ HUMAN OPERATOR ]
        │
        ▼
[ HERMES AGENT ]  ← runs on host, connects to local Ollama
        │
        ├── Skills (7 subsidiaries)
        │   ├── shoe-brand/
        │   ├── travel-index/
        │   ├── game-design/
        │   ├── kids-channel/
        │   ├── innovation-hub/
        │   ├── ewaste-recycling/
        │   └── quantum-wearables/
        │
        ├── Subagent Delegation (parallel workstreams)
        │
        ├── Cron Automation (daily pipelines)
        │
        └── Memory (cross-session corporate context)
                │
                ▼
        [ OLLAMA ]  ← local LLM inference, no cloud
                │
                ▼
        [ agent_zero_usr/documents/ ]  ← shared data volumes
```

---

## 3. Directory Layout

```
C:/Users/young/agents/
├── subsidiaries/                  ← Legal & corporate foundation
│   ├── shoes/
│   ├── kingdesigncollectiveinc/
│   ├── gamedev/
│   ├── kids/
│   ├── innovation/
│   ├── ewaste/
│   ├── quantum/
│   ├── backing_asset_registry.json
│   ├── settlement_token_whitepaper.md
│   └── ...
│
├── agent_zero_usr/                ← Rename to: corporate_runtime/
│   └── documents/
│       ├── shoe_brand/
│       │   ├── inventory.csv
│       │   ├── manifest.json
│       │   ├── images/KingDesignCollective/   ← 53 product assets
│       │   └── legal_reference/               ← 8 docs from subsidiaries/shoes/
│       ├── travel_index/
│       │   ├── country_guides/
│       │   ├── currency_data/
│       │   ├── tiktok_pipeline/
│       │   └── legal_reference/
│       ├── game_design/
│       │   ├── ue5_project/
│       │   ├── mechanics_docs/
│       │   ├── cpp_scripts/
│       │   ├── level_maps/
│       │   ├── system_profiling/
│       │   └── legal_reference/
│       ├── kids_channel/
│       │   ├── story_scripts/
│       │   ├── tts_prompts/
│       │   ├── image_prompts/
│       │   ├── pacing_arcs/
│       │   └── legal_reference/
│       ├── innovation_hub/
│       │   ├── white_papers/
│       │   ├── patent_templates/
│       │   ├── tech_stack_docs/
│       │   ├── system_flowcharts/
│       │   └── legal_reference/
│       ├── ewaste_recycling/
│       │   ├── intake_logs/
│       │   ├── metal_pricing/
│       │   ├── processing_guides/
│       │   ├── logistics_costs/
│       │   └── legal_reference/
│       ├── quantum_wearables/
│       │   ├── thermal_formulas/
│       │   ├── sensor_specs/
│       │   ├── safety_constraints/
│       │   ├── physics_models/
│       │   └── legal_reference/
│       └── crypto_treasury/
│           ├── ledger_templates/
│           ├── atm_node_configs/
│           ├── payload_schemas/
│           ├── tokenomics_docs/
│           └── legal_reference/
│
└── hermes_skills/                  ← Hermes Skill definitions
    ├── shoe-brand/
    │   └── SKILL.md
    ├── travel-index/
    │   └── SKILL.md
    ├── game-design/
    │   └── SKILL.md
    ├── kids-channel/
    │   └── SKILL.md
    ├── innovation-hub/
    │   └── SKILL.md
    ├── ewaste-recycling/
    │   └── SKILL.md
    ├── quantum-wearables/
    │   └── SKILL.md
    └── crypto-treasury/
        └── SKILL.md
```

---

## 4. Hermes Skill Architecture

Each subsidiary is a **Skill** containing:
- `SKILL.md` — System prompt, inputs, outputs, triggers
- `references/` — Static reference docs (legal, technical)
- `templates/` — Reusable output templates
- `scripts/` — Python/bash helpers

**Skill loading order:** Hermes loads skills on demand. For daily operations, configure the master `SOUL.md` or context files to preload the 7 skills.

---

## 5. Master Orchestration Directive (SOUL.md)

This replaces the Agent Zero "Master KingDesignCollectiveINC Router" prompt.

```markdown
# SOUL.md — KingDesignCollectiveINC Corporation Executive Director

You are the Master Orchestrator for the KingDesignCollectiveINC Corporation, a 7-subsidiary holding company. Your purpose is to route tasks to the correct subsidiary skill, delegate parallel workstreams, and maintain strict data segregation between business units.

## Subsidiary Routing

| Skill | Sector | Trigger Keywords |
|---|---|---|
| shoe-brand | Consumer | inventory, ad copy, product images, ecommerce |
| travel-index | Digital Media | travel guide, country data, TikTok, currency |
| game-design | Virtual | Unreal, mechanics, C++, level map, UE5 |
| kids-channel | Media | bedtime story, TTS, narration, child-safe |
| innovation-hub | Deep Tech | patent, white paper, tech stack, IP |
| ewaste-recycling | Industrial Eco | e-waste, gold reclamation, copper, palladium |
| quantum-wearables | Deep Tech | cold fission, thermal, wearable, physics |
| crypto-treasury | Financial | token, ATM, ledger, settlement, payload |

## Operational Rules

1. **DATA SOVEREIGNTY:** Never route data from one subsidiary to another unless explicitly authorized. Legal references are read-only.
2. **PIVOT RULE:** If a tool call fails, instantly fall back to an alternative method. No loop failures.
3. **DELEGATION:** For parallel tasks, use `delegate_task` with up to 3 concurrent subtasks.
4. **CRYPTO CLASSIFICATION:** All tokenomics, ledger data, and ATM configs are CLASS-1. Never expose to external endpoints.
5. **LOCAL ONLY:** All execution happens through local Ollama or local files. No cloud APIs.
```

---

## 6. Replacing Agent Zero Features

### 6.1 Sub-Agent Isolation → Hermes Delegation
```python
# Instead of Agent Zero's custom sub-agent config
# Use Hermes built-in delegation:
delegate_task(
  tasks=[
    {"goal": "Generate shoe brand ad copy for KING-001", "role": "leaf"},
    {"goal": "Update travel index TikTok pipeline", "role": "leaf"},
    {"goal": "Calculate e-waste reclamation yields", "role": "leaf"}
  ]
)
```

### 6.2 Docker Socket Execution → Hermes Terminal
Agent Zero mounted `/var/run/docker.sock` for sandbox execution. Hermes has native terminal access:
```bash
# Hermes can run isolated commands directly
docker compose up -d ollama
ollama pull deepseek-coder:6.7b
```

### 6.3 Memory → Hermes Persistent Memory
- Cross-session memory auto-injected into every turn
- Skills learned from execution are saved and reused
- No manual FAISS configuration needed

### 6.4 Scheduling → Hermes Cron
```yaml
# Daily 6AM shoe inventory check
cronjob(action='create', schedule='0 6 * * *', prompt='Run shoe-brand skill: check inventory.csv, flag low stock, generate restock order')
```

---

## 7. Docker Compose (Ollama Only)

```yaml
version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    container_name: sovereign-ollama-core
    tty: true
    restart: unless-stopped
    environment:
      - OLLAMA_NUM_PARALLEL=4
      - OLLAMA_MAX_LOADED_MODELS=2
    volumes:
      - ollama_storage:/root/.ollama
    networks:
      - secure-corporate-mesh

volumes:
  ollama_storage:
    name: ollama_persistent_weights

networks:
  secure-corporate-mesh:
    name: secure_corporate_mesh
    driver: bridge
```

**Hermes Agent runs on the host** and connects to `http://localhost:11434`.

---

## 8. Security Hardening

| Threat Vector | Hermes Mitigation |
|---|---|
| Adversarial AI breach | Hermes runs in host sandbox; no Docker socket exposed |
| Prompt injection | Skill-level context isolation + read-only legal references |
| Data exfiltration | No cloud providers configured; local-only Ollama |
| Key theft | Crypto keys stored in Hermes encrypted memory, not files |
| Lateral movement | Each skill operates in its own directory scope |

---

## 9. Implementation Checklist

- [ ] Install Hermes Agent on host
- [ ] Install Ollama + pull models
- [ ] Create `corporate_runtime/` folder (rename from `agent_zero_usr/`)
- [ ] Build 7 Hermes Skills under `hermes_skills/`
- [ ] Write `SOUL.md` master directive
- [ ] Configure Hermes provider to point at local Ollama
- [ ] Test single-skill execution (start with shoe-brand)
- [ ] Test parallel delegation across 3 subsidiaries
- [ ] Set up daily cron jobs for cash-flow engines
- [ ] Draft Crypto Treasury signed payload schema
- [ ] Implement Ed25519 signing for inter-agent payloads

---

## 10. Next Phase

1. I will write all 7 `SKILL.md` files with full system prompts
2. Create the simplified `docker-compose.yml` for Ollama only
3. Write the Hermes installation + Ollama connection guide
4. Draft the Crypto Treasury payload schema + verification script

**Approximate completion:** 2-3 hours of active work. Most time is model downloads and skill testing.
