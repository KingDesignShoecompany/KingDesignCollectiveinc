#!/usr/bin/env python3
# Aura Champions Tournament/Judge loop E2E against live stack (port 3103).
import json, time, urllib.request, urllib.error, subprocess, sys

TA = "http://localhost:3103"
REAL_CARD = "DEADBEEFCAFEBABE"   # card_id 50 in card_registry
BOGUS_CARD = "FFFFFFFFFFFFFFFF"
JUDGE = "judge-001"
AUTH = {"Authorization": "Bearer judge-token-xyz"}

def post(path, body, headers=None, expect=None):
    data = json.dumps(body, separators=(",", ":")).encode()
    h = {"Content-Type": "application/json"}
    if headers: h.update(headers)
    req = urllib.request.Request(TA + path, data=data, headers=h, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=6) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read().decode())
        except: return e.code, {}
    except Exception as e:
        return -1, {"error": str(e)}

def db_count(sql):
    r = subprocess.run(["docker","exec","packages-db-1","psql","-U","aura","-d","aura","-t","-c",sql],
                       capture_output=True, text=True)
    return r.stdout.strip()

print("=== AURA TOURNAMENT/JUDGE E2E ===")

# 1) verify REAL card -> signed proof + persisted
st, resp = post("/tournament/verifyCard", {"cardUid": REAL_CARD, "judgeId": JUDGE})
print(f"[1] verifyCard (real)    -> {st}  expect 200  status={resp.get('status')} sig={'yes' if resp.get('proof',{}).get('signature') else 'NO'}")
assert st == 200 and resp.get("status") == "OK" and resp["proof"]["signature"], f"FAIL: {st} {resp}"
# persisted?
cnt = db_count(f"SELECT count(*) FROM judge_verifications WHERE card_uid='{REAL_CARD}';")
print(f"    judge_verifications row for card -> {cnt} (expect >=1)")
assert cnt >= "1", "FAIL: proof not persisted"

# 2) verify BOGUS card -> INVALID
st2, r2 = post("/tournament/verifyCard", {"cardUid": BOGUS_CARD, "judgeId": JUDGE})
print(f"[2] verifyCard (bogus)   -> {st2}  expect 200  status={r2.get('status')}")
assert st2 == 200 and r2.get("status") == "INVALID", f"FAIL: {st2} {r2}"

# 3) createMatch (tournament_id must be a real UUID -> seed a tournament first)
import subprocess as _sp
_tq = _sp.run(["docker","exec","packages-db-1","psql","-U","aura","-d","aura","-t","-c",
               "INSERT INTO tournaments(name,format) VALUES('E2E','bestOf3') RETURNING id;"],
              capture_output=True, text=True)
TID = _tq.stdout.strip().splitlines()[0].strip()
print(f"    seeded tournament id -> {TID[:8]}...")
st3, r3 = post("/tournament/createMatch", {"tournamentId": TID, "players": ["u1","u2"], "format": "bestOf3"})
mid = r3.get("id") or r3.get("match", {}).get("id")
print(f"[3] createMatch         -> {st3}  expect 200  matchId={'yes' if mid else 'NO'}")
assert st3 == 200 and mid, f"FAIL: {st3} {r3}"

# 4) recordResult
st4, r4 = post("/tournament/recordResult", {"matchId": mid, "winnerUserId": "u1", "resultPayload": {"rounds": 2}})
print(f"[4] recordResult        -> {st4}  expect 200  status={r4.get('status')}")
assert st4 == 200 and r4.get("status") == "OK", f"FAIL: {st4} {r4}"

# 5) judge overrideResult (requires Authorization)
st5, r5 = post("/judge/overrideResult", {"matchId": mid, "newWinnerUserId": "u2", "reason": "review"}, AUTH)
print(f"[5] judge override      -> {st5}  expect 200  status={r5.get('status')}")
assert st5 == 200 and r5.get("status") == "OK", f"FAIL: {st5} {r5}"

# 5b) judge override WITHOUT auth -> 401
st5b, _ = post("/judge/overrideResult", {"matchId": mid, "newWinnerUserId": "u2", "reason": "x"})
print(f"[5b] judge override no-auth -> {st5b}  expect 401")
assert st5b == 401, f"FAIL: auth not enforced {st5b}"

# 6) flagDispute (requires Authorization)
st6, r6 = post("/judge/flagDispute", {"matchId": mid, "reason": "suspected tamper"}, AUTH)
print(f"[6] flagDispute         -> {st6}  expect 200  status={r6.get('status')}")
assert st6 == 200 and r6.get("status") == "OK", f"FAIL: {st6} {r6}"

# 7) exportLogs (requires Authorization)
st7, r7 = post("/tournament/exportLogs", {"matchId": mid}, AUTH)
print(f"[7] exportLogs          -> {st7}  expect 200")
assert st7 == 200, f"FAIL: {st7} {r7}"

print("\nALL TOURNAMENT/JUDGE E2E ASSERTIONS PASSED")
