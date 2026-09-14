---
name: aura-backend-master
description: "Design Replit backend: PostgreSQL schema, REST API, battle state manager, anti-cheat."
version: 1.0.0
author: Hermes Agent
license: MIT
category: gaming
metadata:
  hermes:
    tags: ["aura-champions", "backend", "api", "postgres", "battle-sync", "security"]
    related_skills: [game-design, aura-champions]
---

# Backend Master

## Overview
Design and deliver the server-side "source of truth" for Aura Champions. Responsibilities include database schema (Postgres), Express.js REST API routes, battle state manager (server-side combat resolution), NFC verification, replay-attack prevention, and logging for audits.

## When to use
Invoke this skill when you need:
- DB DDL for NTAG216-aware storage
- Express route skeletons and payload contracts
- Anti-cheat design (checksums, replay protection, write-protection emulation)
- BattleSync logic and validation rules

## Responsibilities / Deliverables
1. **SQL schema** for core tables: `users`, `cards_monster`, `cards_item`, `card_registry`, `battles`, `battle_turns`, `scans_log`.
2. **Express.js route skeletons**: `POST /registerCard`, `POST /battleSync`, `POST /action`, `GET /card/:id`, `POST /auth/login`.
3. **BattleSync manager**: deterministic server-side combat resolution (initiative, movement validation, damage calc, cooldowns).
4. **Anti-cheat**: UID+checksum verification, nonce-based replay protection, HMAC signatures, write-protection flags, tamper detection.
5. **Examples**: sample JSON payloads, expected responses, and error codes.
6. **Operational notes**: rate limits, logging format, and migration hints for Replit.

## Implementation Guidance

### 1. PostgreSQL schema (concise)
```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Card registry (official master list)
CREATE TABLE card_registry (
  card_uid TEXT PRIMARY KEY, -- NTAG UID
  card_type TEXT NOT NULL, -- 'monster'|'item'
  card_id INT NOT NULL, -- design ID 1..150
  checksum TEXT NOT NULL, -- server-side canonical checksum
  immutable_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Player-owned cards
CREATE TABLE cards_monster (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES users(id),
  card_uid TEXT REFERENCES card_registry(card_uid),
  level INT DEFAULT 1,
  xp BIGINT DEFAULT 0,
  stats JSONB,
  equipment JSONB,
  battle_history JSONB,
  write_protected BOOLEAN DEFAULT TRUE,
  last_scan TIMESTAMP
);

CREATE TABLE cards_item (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES users(id),
  card_uid TEXT REFERENCES card_registry(card_uid),
  usage_history JSONB,
  owner_data JSONB,
  last_scan TIMESTAMP
);

-- Battles
CREATE TABLE battles (
  id UUID PRIMARY KEY,
  started_at TIMESTAMP DEFAULT now(),
  state JSONB, -- full authoritative state
  players JSONB, -- player ids and teams
  status TEXT, -- 'active'|'finished'|'void'
  result JSONB
);

-- Scans log
CREATE TABLE scans_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  card_uid TEXT,
  action TEXT,
  payload JSONB,
  created_at TIMESTAMP DEFAULT now()
);
```

### 2. Express route skeletons (concise)
```js
// POST /registerCard
// body: { userId, cardUid, cardChecksum, metadata }
app.post('/registerCard', async (req, res) => {
  // verify JWT, validate checksum against card_registry
  // create cards_monster or cards_item row, set owner_id
  // respond with 201 and card record
});

// POST /battleSync
// body: { battleId, userId, action, nonce, signature }
app.post('/battleSync', async (req, res) => {
  // validate nonce, verify HMAC, apply action to authoritative state
  // persist battle state, emit events
  // return updated stateVersion and events
});
```

### 3. Anti-cheat & verification patterns
- **UID + Checksum**: store canonical checksum in `card_registry`. Client sends `{ cardUid, checksum }`. Server verifies equality.
- **HMAC signatures**: client signs action payload with per-session key; server verifies HMAC.
- **Nonces**: each action includes a server-issued nonce; server rejects reused nonces.
- **Write-protection emulation**: critical fields (`immutable_data`) are server-only; client cannot alter them.
- **Tamper detection**: compare card memory snapshot (when available) to canonical `immutable_data`; log mismatches.
- **Rate limiting**: per-user and per-card scan limits; cooldown enforcement.

### 4. Battle resolution (rules summary)
- Server computes initiative by summing team SPD.
- Resolve individual monster turns in deterministic order.
- Validate movement (0-3 tiles), check collisions, validate ability cooldowns.
- Damage formula:
```text
damage = floor((baseATK + weaponATK + bonusATK) * (1 + elementMultiplier) * abilityMultiplier) - floor(targetDEF * (1 - defPenetration))
```
- Apply status effects in Status Phase; update cooldowns; persist state.

## Examples
### POST /registerCard
Request:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "cardUid": "04A224B01C2D80",
  "cardChecksum": "sha256-abc123",
  "metadata": { "source": "nfc", "platform": "android" }
}
```
Response `201`:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "ownerId": "550e8400-e29b-41d4-a716-446655440000",
  "cardUid": "04A224B01C2D80",
  "cardType": "monster",
  "registeredAt": "2026-04-16T08:00:00Z"
}
```

### POST /battleSync
Request:
```json
{
  "battleId":"<battle-uuid>",
  "userId":"<user-uuid>",
  "action": {
    "actor":"<card_uid>",
    "type":"ATTACK",
    "target":"<card_uid>",
    "nonce":"<nonce>",
    "timestamp": 1680000000
  },
  "signature":"<hmac>"
}
```
Response `200`:
```json
{
  "status":"SUCCESS",
  "events":[
    {"type":"DAMAGE","target":"<card_uid>","amount":45,"newHp":135},
    {"type":"STATUS","target":"<card_uid>","effect":"Burn","duration":3}
  ],
  "stateVersion": 42
}
```

### GET /card/:id
Response `200`:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "cardUid": "04A224B01C2D80",
  "cardType": "monster",
  "level": 3,
  "stats": { "atk": 12, "def": 8, "spd": 6 }
}
```

## Operational Notes
- Rate-limit auth and write endpoints.
- Log scans, checksum mismatches, and HMAC failures to `scans_log`.
- Use server-generated nonces and short TTLs.

## Templates & Examples
### Migration SQL
```sql
-- Example: add state_version to battles if missing
ALTER TABLE battles ADD COLUMN IF NOT EXISTS state_version INT DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_battles_state_version ON battles(state_version);
```

### Express middleware example (auth + HMAC)
```js
const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { HMAC_MASTER_SECRET } = require('./config');

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'replace-jwt-secret');
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function verifyHmac({ payloadBase64, signature, timestamp }) {
  const expected = crypto.createHmac('sha256', HMAC_MASTER_SECRET).update(payloadBase64 + '|' + timestamp).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
```

### Battle resolver pseudocode
```text
function resolveTurn(state, action):
  validate(state, action)
  apply(state, action)
  advanceInitiative(state)
  applyStatusPhase(state)
  persist(state)
  emit events
```

### Postman collection
- Import `examples/postman_full_collection.json`
- Set `baseUrl`, `port_backend`, `port_anticheat`, `port_trinity`, `port_tournament`, `port_nfc`
- Run Health, RegisterCard, and BattleSync requests

## Notes
- Keep heavy math and authoritative logic server-side.
- Keep responses minimal and deterministic so clients can animate without recalculation.
