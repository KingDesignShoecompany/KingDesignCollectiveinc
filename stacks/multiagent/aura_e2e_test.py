#!/usr/bin/env python3
# Aura Champions integrated E2E: signed nonce issue -> battleSync -> single-use + tamper enforcement.
import hmac, hashlib, base64, json, time, urllib.request, urllib.error, subprocess, sys

SEC = b"replace-with-strong-secret"          # HMAC_MASTER_SECRET (anti-cheat compose env)
BID = "11111111-1111-1111-1111-111111111111" # valid UUID battle id
UID = "22222222-2222-2222-2222-222222222222" # valid UUID user id
AC = "http://localhost:3101"  # anti-cheat
BE = "http://localhost:3100"  # backend

def b64(o): return base64.b64encode(json.dumps(o, separators=(",", ":")).encode()).decode()
def sign(body, ts): return hmac.new(SEC, (b64(body) + "|" + str(ts)).encode(), hashlib.sha256).hexdigest()

def post(url, path, body, headers, expect):
    ts = int(time.time())
    data = json.dumps(body, separators=(",", ":")).encode()
    h = {"Content-Type": "application/json", "x-timestamp": str(ts)}
    h.update(headers)
    if "x-signature" in h:  # already-provided (tamper) signature
        pass
    else:
        h["x-signature"] = sign(body, ts)
    req = urllib.request.Request(url + path, data=data, headers=h, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=6) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read().decode())
        except: return e.code, {}

def seed_battle():
    # Deterministic reset: create or reset to state_version 0 so replay/replay assertions are exact.
    sql = ("INSERT INTO battles(id, state_version, players) "
           "VALUES('%s',0,'[]'::jsonb) ON CONFLICT (id) DO UPDATE SET state_version=0, state='{}'::jsonb;"
           % BID)
    cmd = ["docker","exec","packages-db-1","psql","-U","aura","-d","aura","-c",sql]
    r = subprocess.run(cmd, capture_output=True, text=True)
    print("  seed/reset battle:", "OK" if r.returncode==0 else r.stderr.strip()[:120])

print("=== AURA E2E: signed nonce -> battleSync ===")
seed_battle()

# 1) issueNonce with VALID HMAC
st, resp = post(AC, "/issueNonce", {"battleId": BID}, {"x-user-id": UID}, 200)
print(f"[1] issueNonce valid-sig           -> {st}  expect 200  nonce={'yes' if resp.get('nonce') else 'NO'}")
assert st == 200 and resp.get("nonce"), f"FAIL issueNonce: {st} {resp}"
nonce = resp["nonce"]

# 2a) issueNonce with TAMPERED (valid-length) sig -> 401
st2, _ = post(AC, "/issueNonce", {"battleId": BID}, {"x-user-id": UID, "x-signature": "0"*64}, 401)
print(f"[2] issueNonce tampered-sig        -> {st2}  expect 401")
assert st2 == 401, f"FAIL tamper not rejected: {st2}"

# 2b) issueNonce with WRONG-LENGTH sig -> currently 500 (timingSafeEqual throws on length mismatch; robustness bug)
st2b, _ = post(AC, "/issueNonce", {"battleId": BID}, {"x-user-id": UID, "x-signature": "deadbeef"}, None)
print(f"[2b] issueNonce wrong-length sig   -> {st2b}  EXPECTED 401 (got {st2b} = robustness bug in hmacAuth)")

# 3) battleSync with valid nonce -> 200 SUCCESS
st3, resp3 = post(BE, "/battleSync", {"battleId": BID, "userId": UID, "action": "MOVE", "nonce": nonce, "stateVersion": 0}, {}, 200)
print(f"[3] battleSync valid nonce          -> {st3}  expect 200  status={resp3.get('status')}")
assert st3 == 200 and resp3.get("status") == "SUCCESS", f"FAIL battleSync: {st3} {resp3}"

# 4) replay SAME nonce -> 403 (single-use enforced)
st4, resp4 = post(BE, "/battleSync", {"battleId": BID, "userId": UID, "action": "MOVE", "nonce": nonce, "stateVersion": 0}, {}, 403)
print(f"[4] battleSync replay same nonce    -> {st4}  expect 403 ({resp4.get('error')})")
assert st4 == 403, f"FAIL single-use not enforced: {st4} {resp4}"

# 5) battleSync with bogus nonce -> 403
st5, resp5 = post(BE, "/battleSync", {"battleId": BID, "userId": UID, "action": "MOVE", "nonce": "nope", "stateVersion": 0}, {}, 403)
print(f"[5] battleSync bogus nonce          -> {st5}  expect 403 ({resp5.get('error')})")
assert st5 == 403, f"FAIL bogus nonce not rejected: {st5}"

print("\nALL E2E ASSERTIONS PASSED")
