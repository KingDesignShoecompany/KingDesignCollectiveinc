---
name: aura-trinity-special
description: "Trinity activation and animation rules for monsters #50, #75, #100 and convergence stone."
version: 1.0.0
author: Hermes Agent
license: MIT
category: gaming
metadata:
  hermes:
    tags: ["aura-champions", "trinity", "battle", "events", "convergence"]
    related_skills: [game-design, aura-champions]
---

# Trinity Special

## Overview
Provide server-side Trinity validation, event emission, and client animation contracts for Aura Champions.

## When to use
Use when you need:
- Trinity activation preconditions
- Server-side state mutation for Trinity
- Event emission: `TRINITY_ACTIVATED`, `TRINITY_CANCELLED`
- Client animation triggers and payloads

## Deliverables
- `trinityValidator.js`: checks trio alive, stone equipped, not already activated
- `trinityService.js`: `checkTrinity`, `applyTrinityEffects`
- `trinityRoutes.js`: `POST /trinity/check`
- `eventEmitter.js`: in-memory or external event dispatch
- Tests and Postman collection

## Activation Rules
- Monsters #50, #75, #100 must be alive on controlling team
- Trinity Convergence Stone must be equipped or in `playerItems`
- `state.trinity.activated` must be false
- On activation: apply `TRINITY_SYNERGY` buff (1.5x) to trio and emit event
