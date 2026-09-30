#!/usr/bin/env python3
# Aura Champions — consolidated live-stack E2E harness (ad-hoc verification, not a suite).
# Covers: (A) anti-cheat signed nonce -> battleSync, (B) tournament/judge loop.
# Requires: Docker daemon running + stack up:
#   docker compose -f "C:\Users\young\agents\hermes_skills\_packages\aura-champions-compose.yml" up -d
# Run: python aura_e2e_harness.py
import hmac, hashlib, base64, json, time, urllib.request, urllib.error, subprocess, sys

SEC = b"replace-with-strong-secret"
BID = "11111111-1111-1111-1111-111111111111"
UID = "22222222-2222-2222-2222-222222222222"
AC, BE, TA = "http://localhost:3101", "http://localhost:3100", "http://localhost:3103"
ok = True
def check(l, c, e=""):
    global ok
    print(f"[{'PASS' if c else 'FAIL'}] {l} {e}")
    if not c: ok = False

def b64(o): return base64.b64encode(json.dumps(o, separators=(",", ":")).encode()).decode()
def post(url, path, body, headers=None, timeout=8):
    ts = int(time.time()); data = json.dumps(body, separators=(",", ":")).encode()
    h = {"Content-Type": "application/json", "x-timestamp": str(ts)}
    if headers: h.update(headers)
    if "x-signature" not in h:
        h["x-signature"] = hmac.new(SEC, (b64(body) + "|" + str(ts)).encode(), hashlib.sha256).hexdigest()
    req = urllib.request.Request(url + path, data=data, headers=h, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read().decode())
        except: return e.code, {}
    except Exception as e:
        return -1, {"error": str(e)}

def db(sql):
    r = subprocess.run(["docker","exec","packages-db-1","psql","-U","aura","-d","aura","-t","-c",sql],
                       capture_output=True, text=True, timeout=15)
    return r.stdout.strip()

print("=== AURA E2E HARNESS ===")
# reset battle to deterministic state_version 0 (avoids stale-version 409 on replay)
db(f"INSERT INTO battles(id,state_version,players) VALUES('{BID}',0,'[]'::jsonb) ON CONFLICT (id) DO UPDATE SET state_version=0, state='{{}}'::jsonb;")

# ---- A) anti-cheat -> battleSync ----
st, resp = post(AC, "/issueNonce", {"battleId": BID}, {"x-user-id": UID})
check("A1 issueNonce valid-sig", st==200 and resp.get("nonce"), f"-> {st}")
nonce = resp.get("nonce")
st, _ = post(AC, "/issueNonce", {"battleId": BID}, {"x-user-id": UID, "x-signature": "0"*64})
check("A2 tamper valid-len ->401", st==401, f"-> {st}")
st, _ = post(AC, "/issueNonce", {"battleId": BID}, {"x-user-id": UID, "x-signature": "deadbeef"})
check("A3 wrong-len sig ->401 (no 500)", st==401, f"-> {st}")
st, resp = post(BE, "/battleSync", {"battleId": BID, "userId": UID, "action": "MOVE", "nonce": nonce, "stateVersion": 0})
check("A4 battleSync valid nonce", st==200 and resp.get("status")=="SUCCESS", f"-> {st}")
st, _ = post(BE, "/battleSync", {"battleId": BID, "userId": UID, "action": "MOVE", "nonce": nonce, "stateVersion": 0})
check("A5 battleSync replay ->403", st==403, f"-> {st}")

# ---- B) tournament / judge ----
st, resp = post(TA, "/tournament/verifyCard", {"cardUid": "DEADBEEFCAFEBABE", "judgeId": "judge-001"})
check("B1 verifyCard real", st==200 and resp.get("status")=="OK" and resp.get("proof",{}).get("signature"), f"-> {st}")
st, r2 = post(TA, "/tournament/verifyCard", {"cardUid": "FFFFFFFFFFFFFFFF", "judgeId": "judge-001"})
check("B2 verifyCard bogus ->INVALID", st==200 and r2.get("status")=="INVALID", f"-> {st}")
# psql RETURNING id has trailing newline -> take first line only
tq = subprocess.run(["docker","exec","packages-db-1","psql","-U","aura","-d","aura","-t","-c",
                     "INSERT INTO tournaments(name,format) VALUES('E2E','bo3') RETURNING id;"],
                    capture_output=True, text=True, timeout=15)
TID = tq.stdout.strip().splitlines()[0].strip()
st, resp = post(TA, "/tournament/createMatch", {"tournamentId": TID, "players": ["u1","u2"], "format": "bo3"})
mid = resp.get("id") or (resp.get("match") or {}).get("id")
check("B3 createMatch (text players)", st==200 and mid, f"-> {st} {resp}")
if mid:
    st, _ = post(TA, "/tournament/recordResult", {"matchId": mid, "winnerUserId": UID, "resultPayload": {"r":2}})
    check("B4 recordResult", st==200, f"-> {st}")
    st, _ = post(TA, "/judge/overrideResult", {"matchId": mid, "newWinnerUserId": UID, "reason":"x"}, {"Authorization":"Bearer t"})
    check("B5 judge override auth", st==200, f"-> {st}")
    st, _ = post(TA, "/judge/overrideResult", {"matchId": mid, "newWinnerUserId": UID, "reason":"x"})
    check("B6 judge override no-auth ->401", st==401, f"-> {st}")
    st, _ = post(TA, "/judge/flagDispute", {"matchId": mid, "reason":"tamper"}, {"Authorization":"Bearer t"})
    check("B7 flagDispute", st==200, f"-> {st}")
    st, _ = post(TA, "/tournament/exportLogs", {"matchId": mid}, {"Authorization":"Bearer t"})
    check("B8 exportLogs", st==200, f"-> {st}")

print("\nRESULT:", "ALL PASS (ad-hoc)" if ok else "FAILURES PRESENT")
sys.exit(0 if ok else 1)
