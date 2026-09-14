# Aura runtime verification: HMAC client + DB role reset

Concise, re-runnable recipes for the two most common "stack won't talk to itself" failures
when hardening / restarting the Aura Champions docker-compose stack.

## 1. HMAC-signed Python client (against live anti-cheat / backend)

The server (`aura-anti-cheat/src/middleware/hmacAuth.js`) computes:
`expected = HMAC-SHA256(HMAC_MASTER_SECRET, base64(JSON.stringify(req.body)) + "|" + x-timestamp)`
and compares with `crypto.timingSafeEqual`. **Compact JSON is mandatory** — Node's
`JSON.stringify` emits no spaces, so the client MUST match.

```python
import json, base64, hmac, hashlib, time, urllib.request, urllib.error

SECRET = "<HMAC_MASTER_SECRET from _packages/.env>"   # NOT the placeholder 'replace-with-strong-secret'
USER  = "11111111-1111-1111-1111-111111111111"        # valid UUID; hmacAuth sets req.user.id from x-user-id

def sign(body_dict, ts):
    b64 = base64.b64encode(json.dumps(body_dict, separators=(",", ":")).encode()).decode()
    return hmac.new(SECRET.encode(), (b64 + "|" + str(ts)).encode(), hashlib.sha256).hexdigest()

def post(url, path, payload):
    data = json.dumps(payload, separators=(",", ":")).encode()
    ts = int(time.time())
    hdr = {"Content-Type": "application/json",
           "x-signature": sign(payload, ts),
           "x-timestamp": str(ts),
           "x-user-id": USER}
    req = urllib.request.Request(url + path, data=data, headers=hdr, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

# issueNonce (anti-cheat) needs a VALID UUID battleId (nonces.battle_id is UUID)
st, body = post("http://localhost:3101", "/issueNonce", {"battleId": "22222222-2222-2222-2222-222222222222"})
nonce = json.loads(body).get("nonce") if st == 200 else None
# battleSync (backend) needs an EXISTING battle row; seed one first via psql if 404:
#   INSERT INTO battles(id,state_version,status) VALUES('2222...2222',1,'active') ON CONFLICT(id) DO UPDATE SET state_version=1,status='active';
st2, body2 = post("http://localhost:3100", "/battleSync",
                  {"battleId": "22222222-2222-2222-2222-222222222222",
                   "userId": USER, "action": "TAP", "nonce": nonce, "stateVersion": 1})
print(st2, body2)   # 200 {status:SUCCESS,stateVersion:2} on a working hardened stack
```

Notes:
- `401 Invalid signature` almost always means the body was serialized with spaces (use `separators=(",",":")`).
- `ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH` in the server log is a *red herring* — it means the
  signature length differed (wrong secret or non-compact body), NOT a compare bug. Fix signing.
- `22P02 string_to_uuid` on issueNonce -> your `battleId`/`userId` is not a valid UUID.
- NFC `issueWriteToken` returns the token under key `writeToken` (not `token`); `operation`
  must be one of `register|fusion|update`. `registerCard` needs `cardType` + `immutableData`.
- Replay detection: call `verifyAction` twice with the same nonce -> 2nd returns 403.

## 2. Postgres role password is stale after rotating DB_PASSWORD

Symptom: after `docker compose down && up` with a new `DB_PASSWORD` in `_packages/.env`,
every DB-backed call 500s with `28P01 password authentication failed` (Postgres log:
`auth.c ... routine: auth_failed`). `docker compose config` shows the new URL, and
local-socket `psql -U aura` works (trust auth) — so it looks fine but TCP fails.

Cause: the `aura` ROLE password was set ONCE at first volume boot from the old `DB_PASSWORD`.
`down/up` does NOT recreate the role on a retained volume.

Fix (local socket = trust, no password needed to connect as superuser `aura`):
```bash
# 1) set the role password to the CURRENT .env DB_PASSWORD
docker exec packages-db-1 sh -c "psql -U aura -d aura -c \"ALTER ROLE aura WITH PASSWORD '<DB_PASSWORD>'\""
# 2) restart app services so they reopen pooled connections with the now-valid password
docker compose -f _packages/aura-champions-compose.yml restart backend anti-cheat trinity-special tournament-admin nfc-handler
# 3) verify TCP auth works
docker exec packages-db-1 sh -c "PGPASSWORD='<DB_PASSWORD>' psql -h db -U aura -d aura -t -c \"SELECT 'ok'\""
```
Also confirm `DATABASE_URL` in the compose is `postgres://aura:${DB_PASSWORD}@db:5432/aura`
(NOT the literal `***`). `docker compose -f ... config` should show the resolved password,
not `***`.

## 3. UE editor live verification (the "render loop" leg)

Launch the editor (NOT `-game` — `-game` with no map tries `/Game/StarterContent/Maps/Minimal_Default`
which does not exist in this re-based project and fails to load a world):
```bash
"/c/UE_5.0/Engine/UE_5.7/Engine/Binaries/Win64/UnrealEditor.exe" \
  "C:/Users/young/agents/corporate_runtime/documents/game_design/ue5_project/auramaxxing/auramaxxing.uproject" \
  -log -abslog=C:/Users/young/AppData/Local/Temp/aura_editor.log -nosplash
```
Success markers in the log:
- `LogPluginManager: Mounting Project plugin AuraClient`
- `LogAuraClient: AuraClient module started.`
- `LogInit: Display: Engine is initialized. Leaving FEngineLoop::Init()`
- Slate/render thread ticking; process stays alive 20s+ with NO `Fatal`/`Assertion failed`/
  `Access violation`. (The `CrashReportClient` + `CrashGUID` lines are benign — always present.)
The visible editor window appears on the user's desktop; the agent cannot click inside it, so
the final "spawn Astral entity + animate" is a manual editor action the user performs.
