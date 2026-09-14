---
name: umbrel
description: Umbrella Corporation Integration Bridge — connects OpenClaw gateway, Hermes skills, Ollama, Bolt.DIY, Agent Zero, n8n, and Aura Champions services into a unified orchestration layer
version: 1.0.0
author: Umbrella Corporation
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [umbrella, integration, orchestration, multi-tool]
    related_skills: [hermes-agent, openclaw-migration, shoe-brand, travel-index, game-design, kids-channel, innovation-hub, ewaste-recycling, quantum-wearables, crypto-treasury, aura-champions]
---

# Umbrella Integration Bridge

This skill connects OpenClaw to the full Umbrella stack. When OpenClaw receives a task, it can route through Hermes skills, delegate to Agent Zero, trigger n8n workflows, generate content via Bolt.DIY, and manage Aura Champions game state.

## Architecture

```
[Human] -> [OpenClaw Gateway :18789] -> [Hermes Skills]
                                          |
                    +---------------------+---------------------+
                    |                     |                     |
              [Ollama :11435/:8002]  [Agent Zero :8001]  [Bolt.DIY :5173]
                                          |                     |
                    +---------------------+---------------------+
                    |
              [n8n :5678] --> [Aura Services :3100-3104, :5432]
```

## Key Integrations

### 1. OpenClaw <-> Hermes
OpenClaw's gateway exposes HTTP endpoints that Hermes skills can call:
- `POST http://localhost:18789/api/hermes/run` — Execute a Hermes skill with a task
- `POST http://localhost:18789/api/hermes/task` — Dispatch a task to a Hermes skill
- `GET http://localhost:18789/api/status` — Get OpenClaw/Hermes status

### 2. Hermes <-> Ollama
Hermes connects to Ollama via the OpenAI-compatible proxy:
- Direct Ollama: `http://127.0.0.1:11435/v1`
- Proxy (qwen3:8b): `http://127.0.0.1:8002/v1`

### 3. Bolt.DIY <-> Ollama
Bolt.DIY is configured to use the Ollama proxy as its OpenAI-compatible backend.
- URL: `http://host.docker.internal:8002/v1`
- Model: `ollama/glm-4.7-flash` (via proxy)

### 4. n8n <-> All Services
n8n workflows orchestrate cross-tool pipelines using webhooks and HTTP requests to each service.

## Usage

### From OpenClaw (Telegram, CLI, or API):

```
# Route a task to Hermes skills
@hermes run innovation-hub "Analyze patent US1234567 for AR card battler IP"

# Generate a subsidiary webapp via Bolt.DIY
@hermes run shoe-brand "Generate e-commerce page for SASSY SOL sneaker"

# Trigger a tournament sync in Aura Champions
@hermes run aura-champions "Sync active tournaments and reconcile matches"

# Run a cross-tool content pipeline
@hermes run umbrel "Daily: generate TikTok script -> Agent Zero refinement -> story dispatch"
```

### From Hermes (directly):

```
openclaw gateway http://localhost:18789/api/hermes/run
```

## Services Reference

| Service | Port | Purpose |
|---------|------|---------|
| OpenClaw Gateway | 18789 | Central gateway, skill routing |
| Ollama | 11435 | Local LLM inference (gemma3:1b) |
| Ollama Proxy | 8002 | OpenAI-compatible proxy (qwen3:8b) |
| Agent Zero API | 8001 | Multiagent workforce API |
| Bolt.DIY | 5173 | Web app generation factory |
| Umbrella Web | 3000 | Dashboard host |
| n8n | 5678 | Automation pipelines |
| Aura Backend | 3100 | Game backend REST API |
| Aura Anti-Cheat | 3101 | HMAC verification |
| Aura Trinity | 3102 | Special monster events |
| Aura Tournament | 3103 | Tournament management |
| Aura NFC | 3104 | NFC card handling |
| PostgreSQL | 5432 | Shared database |

## Commands

```bash
# Check all service health
python3 scripts/check_all_services.py

# Start the full stack
docker compose -f docker-compose.umbrella.yml up -d

# Reload n8n workflows
n8n import --separate --input=./workflows/

# Restart OpenClaw gateway
openclaw gateway restart
```

## Important Notes

- All services bind to localhost only (127.0.0.1) for security
- Docker host networking uses `host.docker.internal` to reach host services
- OpenClaw gateway uses a static auth token — see config
- n8n credentials must be configured per-service
