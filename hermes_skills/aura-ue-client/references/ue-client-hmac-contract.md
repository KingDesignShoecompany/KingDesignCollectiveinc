# UE Client — HMAC / BattleSync Contract (verified against live stack)

## Signing contract (mirrors backend hmacAuth.js)
- Algorithm: HMAC-SHA256 over `base64(JSON body) + "|" + unix_timestamp_seconds`, hex-encoded.
- Headers sent per request:
  - `x-signature`: the hex HMAC
  - `x-timestamp`: unix seconds (must be within 60s of server or `Stale timestamp` 400)
  - `x-user-id`: claimed identity (HMAC proves authenticity; server sets `req.user` from it)
- Body serialization: compact JSON, no whitespace (`separators=(",",":")`). Key order matters for the signature.
- Node's `crypto.timingSafeEqual` throws on length mismatch — the backend MUST length-check before comparing or a malformed sig 500s instead of 401 (this was a real bug, now fixed in hmacAuth.js).

## Flow (AAuraGameClient::SendBattleAction)
1. POST `/issueNonce` (anti-cheat, port 3101) with `{battleId}` -> returns `{nonce, expiresAt}`.
2. POST `/battleSync` (backend, port 3100) with `{battleId, userId, action, nonce, stateVersion}` -> `{status:"SUCCESS", stateVersion, events}`.
3. Nonce is single-use; replay returns 403. `battleSync` requires the battle row to exist with matching `state_version` (else 409 stale / 404 not found).

## Server-returned events the client animates (no client resolution)
- `DAMAGE {target, amount, newHp}`, `STATUS {target, effect, duration}`, `TRINITY_ACTIVATED`, `SUMMON`.
- On `TRINITY_ACTIVATED`, lock input and play VFX.

## Verification
UE 5.7 IS now installed (2026-08) at `C:/UE_5.0/Engine/UE_5.7/Engine/` — a real UBT compile is
possible. Pre-compile, the contract can also be checked by replicating the signing in Python and
confirming the live backend accepts it (see aura-champions/scripts/aura_e2e_gate.py).

## Plugin load prerequisites
- The plugin MUST have an `AuraClient.uplugin` descriptor or UE will not load the module (it was
  missing originally — now added at the plugin root).
- Build.cs dependencies (this installed 5.7 engine): `Core, CoreUObject, Engine, HTTP, Json,
  JsonUtilities`. NOTE: `HTTP` is UPPERCASE (lowercase `Http` → case warning), and `Crypto` is
  NOT a valid module here (no `Crypto.Build.cs`) — do NOT add it.
- `FHMAC` / `FEncryption` are NOT publicly exposed in this engine. Implement HMAC-SHA256 with
  `FSHA256` (Core) — portable RFC 2104 snippet in `references/ue5-build-errors.md`. The original
  `FHMAC`/`Crypto/Crypto.h` version failed to compile (error #4), now replaced.
- NFC platform bridges (AndroidNfcBridge.java / NFCSessionManager.swift) are NOT in this plugin;
  the C++ handles the post-read HTTP flow only. The tap that produces `CardUid` is still unbuilt.
