---
name: hermes-bridge
description: OpenClaw skill that bridges to Hermes Agent — routes OpenClaw tasks to the correct Hermes subsidiary skill, dispatches via the integration bridge, and reports results back through OpenClaw's Telegram/CLI channel.
version: 1.0.0
author: Umbrella Corporation
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [openclaw, bridge, integration, routing, subsidiary]
    related_skills: [openclaw-migration, hermes-agent, shoe-brand, travel-index, game-design, kids-channel, innovation-hub, ewaste-recycling, quantum-wearables, crypto-treasury, aura-champions]
---

# OpenClaw <-> Hermes Bridge Skill

This skill enables OpenClaw to act as the human-facing orchestrator for the entire Umbrella stack. When a user sends a command to OpenClaw (via Telegram, CLI, or API), this skill:

1. Routes the task to the correct Hermes subsidiary skill
2. Dispatches it through the integration bridge (port 8090)
3. Optionally triggers n8n workflows for multi-step pipelines
4. Reports results back through OpenClaw's response channel

## Configuration

Set these in OpenClaw's config or environment:

```bash
# Integration bridge endpoint (runs alongside OpenClaw gateway)
export HERMES_BRIDGE_URL=http://127.0.0.1:8090

# Or set in openclaw.json:
{
  "skills": {
    "entries": {
      "hermes-bridge": {
        "enabled": true,
        "config": {
          "bridgeUrl": "http://127.0.0.1:8090",
          "ollamaUrl": "http://127.0.0.1:11435",
          "n8nWebhook": "http://127.0.0.1:5678/webhook"
        }
      }
    }
  }
}
```

## Task Routing

The skill uses keyword matching to route tasks to the correct Hermes subsidiary:

| Keywords | Skill | Sector |
|----------|-------|--------|
| inventory, ad copy, product, ecommerce, shoe | shoe-brand | Consumer |
| travel, country, TikTok, currency, guide | travel-index | Digital Media |
| Unreal, mechanics, C++, level, UE5 | game-design | Virtual |
| bedtime, story, TTS, narration, child | kids-channel | Media |
| patent, white paper, tech stack, IP | innovation-hub | Deep Tech |
| e-waste, gold, copper, palladium | ewaste-recycling | Industrial Eco |
| cold fission, thermal, wearable, physics | quantum-wearables | Deep Tech |
| token, ATM, ledger, settlement, payload | crypto-treasury | Financial |
| card-battler, AR, NFC, battle, tournament | aura-champions | Gaming |

## Commands

```
# Route a task — OpenClaw will auto-detect the subsidiary
@hermes "Generate product images for SASSY SOL sneakers"

# Explicit skill targeting
@hermes run shoe-brand "Create ad copy for Cinematic Street-King collection"
@hermes run travel-index "Generate TikTok script for Japan travel guide"
@hermes run game-design "Document battle mechanics for Aura Champions"
@hermes run innovation-hub "Analyze patent US1234567 for AR card battler"
@hermes run crypto-treasury "Generate settlement report for today's transactions"

# Cross-tool pipeline (triggers n8n workflow)
@hermes pipeline "daily-content" "Generate TikTok scripts for all subsidiaries"

# Full stack status
@hermes status
```

## Integration Endpoints

The skill calls the integration bridge at `http://127.0.0.1:8090`:

- `POST /api/umbrella/route` — Route a task to determine the subsidiary
- `POST /api/umbrella/execute` — Execute a task via Hermes
- `GET /api/umbrella/status` — Get full stack health
- `POST /api/umbrella/n8n-trigger` — Trigger an n8n workflow

## Example Task Flow

```
User: @hermes run shoe-brand "Create TikTok script for SASSY SOL"
  → OpenClaw calls hermes-bridge skill
  → Skill routes to shoe-brand via integration bridge
  → Bridge dispatches to Hermes shoe-brand skill
  → Hermes skill generates script via Ollama
  → Result returned to OpenClaw
  → OpenClaw sends result back to user via Telegram
```

## Cross-Tool Pipelines

The skill can trigger n8n webhooks to run multi-step pipelines:

1. **daily-content**: Bolt.DIY generates web assets → Agent Zero refines → Hermes skills review → n8n archives
2. **tournament-monitor**: Aura tournament API → Hermes tournament-admin skill → n8n notification → OpenClaw alert
3. **treasury-report**: crypto-treasury skill → PostgreSQL query → n8n report generation → OpenClaw summary

## Important Notes

- This skill must be installed alongside the integration bridge (scripts/bridge.py)
- The bridge auto-starts if not running
- All communication is localhost-only (no external API calls)
- n8n webhooks are optional — if n8n is down, tasks proceed without the pipeline layer
