---
name: aura-tournament-admin
description: "Tournament administration tools: judge verification, match logging, sideboard handling, and legality checks."
version: 1.0.0
author: Hermes Agent
license: MIT
category: gaming
metadata:
  hermes:
    tags: ["aura-champions", "tournament", "judge", "rules", "legality"]
    related_skills: [game-design, aura-champions]
---

# Tournament Admin

## Overview
Provide judge-facing endpoints and server-side tooling to enforce tournament rules, verify card legality, manage sideboard swaps, and export match logs for appeals.

## When to use
Use when you need:
- Tournament match creation and time control
- Deck/team legality validation
- Judge verification and signed proofs
- Match log export for appeals

## Deliverables
- `verifyCardForTournament` route returning signed proof
- `tournamentRoutes.js`: match creation, sideboard registration, result recording
- `deckLegality.js`: validate active team composition against banned lists
- `matchLogger.js`: immutable match logs for appeals
- Postman collection and judge app flow documentation

## Key Rules
- Max 2 copies of any card_id
- No duplicate card_uid in deck or team
- Sideboard swaps only between rounds
- Banned cards enforced by `effective_from` date
