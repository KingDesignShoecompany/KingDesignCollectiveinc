# Aura Champions — Live E2E Verification

Ad-hoc suites (NOT a CI suite) that prove the running stack actually cooperates.
Both live under `C:/Users/young/stacks/multiagent/` and seed their own DB fixtures, so they are re-runnable.

## Files
- `aura_e2e_test.py` — anti-cheat + battle flow.
- `aura_tournament_e2e.py` — tournament/judge loop.

## Prereqs
- Docker Desktop running; stack up: `docker compose -f C:/Users/young/agents/hermes_skills/_packages/aura-champions-compose.yml up -d`.
- Health: 3100–3103 → 200. (nfc-handler :3104 has no `/health` — 404 is expected, not a failure.)

## Real endpoint map (discovered, not from docs)
- anti-cheat :3101 — `/issueNonce` (HMAC), `/verifyAction` (HMAC), `/verifyCardForTournament` (HMAC)
- backend    :3100 — `/battleSync` (NO HMAC; consumes nonce), `/registerCard`, `/writeToken`
- tournament :3103 — `/tournament/createMatch`, `/tournament/recordResult`, `/tournament/sideboardSwap`, `/tournament/verifyCard` (signed proof), `/tournament/exportLogs`, `/judge/overrideResult`, `/judge/flagDispute`
- HMAC middleware (`hmacAuth`) is mounted ONLY on anti-cheat routes. `battleSync` checks the nonce but never verifies the signature.

## HMAC client recipe (anti-cheat)
```python
import hmac, hashlib, base64, json, time, urllib.request
SEC = b"replace-with-strong-secret"
def b64(o): return base64.b64encode(json.dumps(o, separators=(",",":")).encode()).decode()
def sign(body, ts): return hmac.new(SEC,(b64(body)+"|"+str(ts)).encode(),hashlib.sha256).hexdigest()
# headers: x-signature=sign(body,ts), x-timestamp=ts, x-user-id=<uuid>
```
Python MUST serialize with `separators=(",",":")` and matching key order, or the signature won't match Node's `JSON.stringify` (verified the hard way).

## Anti-cheat/battle assertions (all PASS)
1. issueNonce valid sig → 200, nonce returned.
2. issueNonce tampered (valid-length) sig → 401.
3. issueNonce wrong-length sig → 401 (FIXED: hmacAuth now length-checks before `timingSafeEqual`, which threw 500 on length mismatch).
4. battleSync valid nonce → 200 SUCCESS.
5. battleSync replay same nonce → 403.
6. battleSync bogus nonce → 403.

## Tournament/judge assertions (all PASS)
- verifyCard real → 200 signed proof persisted to `judge_verifications`.
- verifyCard bogus → 200 INVALID.
- createMatch (real tournament UUID, TEXT players) → 200.
- recordResult → 200.
- judge override with auth → 200; without → 401.
- flagDispute → 200; exportLogs (auth) → 200.

## Bugs found & fixed (2026-08) — regression guards
- `aura-anti-cheat/src/middleware/hmacAuth.js`: `crypto.timingSafeEqual` threw on unequal buffer lengths → 500. Fixed with a length pre-check.
- `aura-tournament-admin/src/services/tournamentRules.js`: `createMatch`/`recordResult` were not exported → 500. Implemented against the `matches` table.
- Migrations added (applied live + in both trees):
  - `002_matches_extra_columns.sql`: +format, winner_user_id, result_payload, judge_override, override_reason.
  - `003_players_text.sql`: player1/player2 UUID→TEXT (opaque user-ids).
- psql `RETURNING id` output includes a trailing newline + "INSERT 0 1"; strip with `.strip().splitlines()[0].strip()` before using as a UUID param.
- `docker cp` MSYS path trap: inside git-bash the POSIX path `/c/Users/...` is mangled and `docker cp` fails with "Cannot find the file specified". Use the Windows form `C:\Users\...` for `docker cp`. For syntax checks prefer `docker exec <container> node --check <container-path>`.
