# Aura Champions — "Astral Convergence" Trinity Effect + NTAG216 Schema
# Option 3 deliverable. Real, reproducible design using the proven HMAC-SHA256 recipe.

## 1. Effect Definition
- Name: Astral Convergence
- Trigger condition: simultaneous activation of THREE Astral-class cards on the same
  team in one resolution window (Astral = class field `class == "Astral"`; distinct from
  the 5 elemental classes Lunar/Solar/Void/Stellar/Null).
- Effect: stacking buff — each participating Astral card grants +12% spectral damage
  (multiplicative per card, capped at 3 stacks = +36%).
- Duration: 3 turns.
- Side effect: 5% of current HP recoil to each participating card at activation.

## 2. Activation Flow (tying to Option 2 + live services)
- Client (auramaxxing UE plugin) detects 3 Astral cards activated in one battleSync
  action, sets `action: "TRINITY_ACTIVATED"`, `trinity: {effect:"AstralConvergence"}`.
- POST /battleSync (backend:3100) carries the nonce (issued by anti-cheat /issueNonce).
- anti-cheat /verifyAction consumes the single-use nonce -> replay protected.
- trinity service /trinity/check(state) confirms 3 Astral-class present -> ACTIVATED.
- Matches the real `trinityRoutes.js` contract: POST /trinity/check {battleId, state}
  -> {status:"ACTIVATED"|"NOT_ACTIVATED"}.

## 3. NTAG216 Memory Layout (NTAG216 = 888 bytes user memory, 4-byte pages, page 4..227)
Effect config + per-card activation record stored on the physical card.

PAGE MAP (4 bytes/page):
  Page 4-7   : HEADER  (16 B)  - magic "AURA", schema ver, effect id
  Page 8-11  : EFFECT  (16 B)  - trigger class, buff%, duration, recoil%
  Page 12-15 : CARDSET (16 B)  - 3x card slot refs (4 B each: 2B card_id + 2B class)
  Page 16-19 : STATE   (16 B)  - active flag, turns_remaining, stacks
  Page 20-23 : HWMPROOF(16 B)  - HMAC-SHA256 over PAGES 4..19 (the covered region)
  Page 24..  : LOG     (remaining) - ring buffer of activation events (4 B each:
               ts_low, card_id_lo, dmg, flags)

FIELD DETAILS (little-endian unless noted):
  HEADER:  [0:4]="AURA" [4:1]=schema_ver(0x03) [5:1]=effect_id(0x01) [6:2]=reserved
  EFFECT:  [0:1]=trigger_class(0x06=Astral) [1:1]=buff_pct_per_card(0x0C=12)
           [2:1]=duration_turns(0x03) [3:1]=recoil_pct(0x05) [4:12]=reserved
  CARDSET: slot0[0:2]=card_id [2:2]=class ; slot1.. ; slot2..  (class 0x06=Astral)
  STATE:   [0:1]=active(0/1) [1:1]=turns_remaining [2:1]=stacks [3:1]=reserved
           [4:12]=reserved

## 4. Payload Encoding (what the client writes to the card)
JSON compact form (matches server's compact-JSON HMAC expectation):
  {"e":"AC","trig":6,"buff":12,"dur":3,"rec":5,"cards":[id0,id1,id2],"cls":[6,6,6]}
Encoded to the CARDSET+EFFECT pages as above; STATE initialized to
  {active:1, turns_remaining:3, stacks:3}.

## 5. HMAC Coverage Map
- Algorithm: HMAC-SHA256( HMAC_MASTER_SECRET, base64(payload)+"|"+timestamp )
  (identical to the proven anti-cheat hmacAuth recipe; same 64-hex-char output).
- COVERED (signed) region: PAGES 4..19 (HEADER + EFFECT + CARDSET + STATE),
  i.e. all mutable intent/state data.
- EXCLUDED from signature: the HMAC field itself (PAGES 20-23) and the LOG ring
  (PAGES 24+) — log is write-once evidence, not part of the signed intent.
- Verification: reader recomputes HMAC over PAGES 4..19 with the same secret;
  mismatch => card rejected (tamper/clone). Per-card checksum (card_registry.checksum)
  cross-checked against server registry on /registerCard.

## 6. Anti-tamper notes
- Single-use nonce (anti-cheat nonces.used=TRUE) prevents replay of a Convergence.
- 5% recoil is applied server-side in /battleSync state transition, not trusted from card.
- HMAC secret is the shared HMAC_MASTER_SECRET; card never stores the secret.

## 7. Repro check (this session)
- HMAC recipe proven correct vs RFC HMAC-SHA256 reference (execute_code verification).
- NTAG216 888B / 4B-page model matches NXP NTAG216 datasheet (user memory 888 bytes).
- Trinity trigger logic matches aura-trinity-special /trinity/check contract.
