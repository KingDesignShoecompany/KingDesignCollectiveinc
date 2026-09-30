# Aura Champions — Docker Runtime Playbook (Windows host)

## Stack layout
Single compose: `C:/Users/young/agents/hermes_skills/_packages/aura-champions-compose.yml`
Each service bind-mounts its skill `src/` + host `node_modules` into `node:20-alpine`.
DB: `postgres:16-alpine`. Init SQL from each skill's `migrations/` into `/docker-entrypoint-initdb.d/`.

| Service        | Container port | Host port | DB tables created |
|----------------|---------------|-----------|-------------------|
| db             | 5432          | 5432      | (all)             |
| backend        | 3000          | 3100      | card_registry, cards_*, scans_log, battles, battle_events |
| anti-cheat     | 3001          | 3101      | nonces, audit_logs, session_keys, judge_verifications |
| trinity-special| 3002          | 3102      | (stateless)       |
| tournament-admin| 3003         | 3103      | tournaments, matches, banned_list, match_logs, match_disputes |
| nfc-handler    | 4000          | 3104      | (stateless; issues/validates write tokens) |

## Bring it up (clean)
```bash
cd "C:/Users/young/agents/hermes_skills"
docker compose -f _packages/aura-champions-compose.yml down --remove-orphans
docker rm -f packages-db-1 packages-backend-1 packages-anti-cheat-1 packages-trinity-special-1 packages-tournament-admin-1 packages-nfc-handler-1
docker volume rm $(docker volume ls -q | grep packages)   # volume is packages_pgdata, NOT aura_pgdata
docker compose -f _packages/aura-champions-compose.yml up -d
sleep 18
docker compose -f _packages/aura-champions-compose.yml ps
```
Health: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/health` (and 3101-3104).

## After editing a src/*.js (no hot reload!)
`docker restart packages-<service>-1` - otherwise the running container serves stale code and E2E will 500 on a fix you "just made".

## HMAC-signed end-to-end battle flow (ad-hoc test)
Shared secret (compose default): `replace-with-strong-secret` = `HMAC_MASTER_SECRET`.
Middleware signs `base64(JSON body) + "|" + timestamp` with HMAC-SHA256; expects headers
`x-signature`, `x-timestamp`, `x-user-id`.

```python
import hmac, hashlib, base64, json, urllib.request, time
SEC=b"replace-with-strong-secret"; URL="http://localhost"
BID="11111111-1111-1111-1111-111111111111"; UID="22222222-2222-2222-2222-222222222222"
def b64(o): return base64.b64encode(json.dumps(o,separators=(",",":")).encode()).decode()
def post(port,path,body,user=UID):
    ts=int(time.time()); bb=b64(body)
    sig=hmac.new(SEC,(bb+"|"+str(ts)).encode(),hashlib.sha256).hexdigest()
    req=urllib.request.Request(f"{URL}:{port}{path}",data=json.dumps(body,separators=(",",":")).encode(),
        headers={"Content-Type":"application/json","x-timestamp":str(ts),"x-signature":sig,"x-user-id":user},method="POST")
    try:
        with urllib.request.urlopen(req,timeout=5) as r: return r.status,json.loads(r.read().decode())
    except urllib.error.HTTPError as e: return e.code,json.loads(e.read().decode())
# seed a battle first (psql): INSERT INTO battles(id,state_version,players) VALUES('<BID>',0,'[]'::jsonb);
st,resp=post(3101,"/issueNonce",{"battleId":BID}); nonce=resp["nonce"]          # expect 200
st2,_=post(3100,"/battleSync",{"battleId":BID,"userId":UID,"action":"MOVE","nonce":nonce,"stateVersion":0})  # 200/201
st3,_=post(3100,"/battleSync",{...same...})                                       # 403/409 (single-use)
```
KEY: Python MUST serialize with `separators=(",",":")` and matching key order, or the base64 won't match Node's `JSON.stringify` and the signature check fails.

## Gotchas encountered & fixed
- `expires_at` was on wrong table (`judge_verifications`); index referenced missing column -> db init failed. Now on `nonces`, index after table.
- `hmacAuth` didn't set `req.user` -> `issueNonce` 401. Now sets `req.user={id}` from `x-user-id`.
- `battleSync` crashed on null/empty `battle.state` (`state.teams is not iterable`) — `trinityChecker.hasMonster`/`checkTrinity` iterated `state.teams` with no guard. **FIXED 2026-08-19**: `aura-backend-master/src/services/trinityChecker.js` now guards both `hasMonster` and `checkTrinity` (`if (!state || !Array.isArray(state.teams)) return null / {active:false}`). No hot reload — `docker restart packages-backend-1` after the edit. Verified: empty `{}` → `{active:false}`, full valid Trinity → `active:true`, and the HMAC E2E battleSync now returns 200 (was 500).
- Cross-container requires (`../trinity-special/...`, `../../anti-cheat/...`) -> made each service self-contained (local `db.js`, `secureUtils.js`, `trinityChecker.js`).
- `judgeVerification` INSERT omitted NOT-NULL `registry_snapshot`/`signed_proof` -> included.
- `judgeTools`/`exportLogs` passed auth *object* as middleware -> use `auth.requireJudge`.
- nfc-handler deps: `express body-parser crypto` only. anti-cheat & tournament also need `winston`.
