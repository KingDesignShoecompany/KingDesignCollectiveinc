#!/usr/bin/env python3
# aura_e2e_gate.py
# Consolidated Aura Champions E2E gate (stdlib-only, no pytest dependency).
# Covers the three verified live flows + the UE-client HMAC contract check.
# Run:  python aura_e2e_gate.py            (exits 0 if all pass, 1 if any fail)
#        python aura_e2e_gate.py --no-db   (skip flows that need docker/psql)
import sys, os, json, time, hmac, hashlib, base64, urllib.request, urllib.error, subprocess, argparse

# ---- config (mirrors compose env) ----
HMAC_SECRET = os.environ.get("HMAC_MASTER_SECRET", "replace-with-strong-secret").encode()
AC = "http://localhost:3101"   # anti-cheat
BE = "http://localhost:3100"   # backend
TA = "http://localhost:3103"   # tournament/judge
NFC = "http://localhost:3104"  # nfc-handler
BID = "11111111-1111-1111-1111-111111111111"
UID = "22222222-2222-2222-2222-222222222222"
REAL_CARD = "DEADBEEFCAFEBABE"   # card_id 50
BOGUS_CARD = "FFFFFFFFFFFFFFFF"
JUDGE = "judge-001"
AUTH = {"Authorization": "Bearer judge-token-xyz"}

passed = 0
failed = 0
def ok(name, cond, detail=""):
    global passed, failed
    if cond:
        passed += 1
        print(f"  [PASS] {name} {detail}")
    else:
        failed += 1
        print(f"  [FAIL] {name} {detail}")

def b64(o): return base64.b64encode(json.dumps(o, separators=(",", ":")).encode()).decode()
def sign(body, ts): return hmac.new(HMAC_SECRET, (b64(body) + "|" + str(ts)).encode(), hashlib.sha256).hexdigest()

def post(url, path, body, headers=None, method="POST", timeout=8):
    data = json.dumps(body, separators=(",", ":")).encode()
    h = {"Content-Type": "application/json"}
    if headers: h.update(headers)
    ts = int(time.time())
    if "x-signature" not in h and path in ("/issueNonce",):
        h["x-signature"] = sign(body, ts)
        h["x-timestamp"] = str(ts)
    elif "x-timestamp" not in h:
        h["x-timestamp"] = str(ts)
    req = urllib.request.Request(url + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read().decode())
        except: return e.code, {}
    except Exception as e:
        return -1, {"error": str(e)}

def db(sql, timeout=15):
    r = subprocess.run(["docker","exec","packages-db-1","psql","-U","aura","-d","aura","-t","-c",sql],
                       capture_output=True, text=True, timeout=timeout)
    return r.returncode, r.stdout.strip()

def udp(): return urllib.request.urlopen(NFC+"/health", timeout=5).status

# ================= FLOW 1: BATTLE HMAC + SINGLE-USE =================
def flow_battle():
    print("--- Flow 1: battle HMAC + single-use nonce ---")
    sql = ("INSERT INTO battles(id,state_version,players) VALUES('%s',0,'[]'::jsonb) "
           "ON CONFLICT (id) DO UPDATE SET state_version=0, state='{}'::jsonb;" % BID)
    rc, _ = db(sql)
    ok("battle seed", rc == 0)

    st, resp = post(AC, "/issueNonce", {"battleId": BID}, {"x-user-id": UID})
    ok("issueNonce valid-sig ->200", st == 200 and bool(resp.get("nonce")), f"-> {st}")
    nonce = resp.get("nonce")

    st2, _ = post(AC, "/issueNonce", {"battleId": BID}, {"x-user-id": UID, "x-signature": "0"*64})
    ok("issueNonce tampered-sig ->401", st2 == 401, f"-> {st2}")
    st2b, _ = post(AC, "/issueNonce", {"battleId": BID}, {"x-user-id": UID, "x-signature": "deadbeef"})
    ok("issueNonce wrong-length-sig ->401", st2b == 401, f"-> {st2b}")

    st3, r3 = post(BE, "/battleSync", {"battleId": BID, "userId": UID, "action": "MOVE", "nonce": nonce, "stateVersion": 0})
    ok("battleSync valid nonce ->200 SUCCESS", st3 == 200 and r3.get("status") == "SUCCESS", f"-> {st3}")
    st4, _ = post(BE, "/battleSync", {"battleId": BID, "userId": UID, "action": "MOVE", "nonce": nonce, "stateVersion": 0})
    ok("battleSync replay same nonce ->403", st4 == 403, f"-> {st4}")
    st5, _ = post(BE, "/battleSync", {"battleId": BID, "userId": UID, "action": "MOVE", "nonce": "nope", "stateVersion": 0})
    ok("battleSync bogus nonce ->403", st5 == 403, f"-> {st5}")

# ================= FLOW 2: TOURNAMENT / JUDGE =================
def flow_tournament():
    print("--- Flow 2: tournament / judge loop ---")
    rc, TID = db("INSERT INTO tournaments(name,format) VALUES('E2E','bestOf3') RETURNING id;")
    TID = TID.splitlines()[0].strip() if rc == 0 else ""
    ok("seed tournament", rc == 0 and TID, f"-> {TID[:8] if TID else 'NONE'}")

    st, resp = post(TA, "/tournament/verifyCard", {"cardUid": REAL_CARD, "judgeId": JUDGE})
    ok("verifyCard real ->200 OK + signed proof", st == 200 and resp.get("status") == "OK" and resp.get("proof", {}).get("signature"), f"-> {st}")
    _, cnt = db(f"SELECT count(*) FROM judge_verifications WHERE card_uid='{REAL_CARD}';")
    ok("verifyCard proof persisted", cnt.isdigit() and int(cnt) >= 1, f"-> {cnt}")
    st2, r2 = post(TA, "/tournament/verifyCard", {"cardUid": BOGUS_CARD, "judgeId": JUDGE})
    ok("verifyCard bogus ->200 INVALID", st2 == 200 and r2.get("status") == "INVALID", f"-> {st2}")

    st3, r3 = post(TA, "/tournament/createMatch", {"tournamentId": TID, "players": ["u1","u2"], "format": "bestOf3"})
    mid = r3.get("id") or r3.get("match", {}).get("id")
    ok("createMatch ->200", st3 == 200 and bool(mid), f"-> {st3}")
    st4, r4 = post(TA, "/tournament/recordResult", {"matchId": mid, "winnerUserId": "22222222-2222-2222-2222-222222222222", "resultPayload": {"rounds": 2}})
    ok("recordResult ->200 OK", st4 == 200 and r4.get("status") == "OK", f"-> {st4}")
    st5, r5 = post(TA, "/judge/overrideResult", {"matchId": mid, "newWinnerUserId": "33333333-3333-3333-3333-333333333333", "reason": "review"}, AUTH)
    ok("judge override (auth) ->200", st5 == 200 and r5.get("status") == "OK", f"-> {st5}")
    st5b, _ = post(TA, "/judge/overrideResult", {"matchId": mid, "newWinnerUserId": "u2", "reason": "x"})
    ok("judge override no-auth ->401", st5b == 401, f"-> {st5b}")
    st6, r6 = post(TA, "/judge/flagDispute", {"matchId": mid, "reason": "tamper"}, AUTH)
    ok("flagDispute (auth) ->200", st6 == 200 and r6.get("status") == "OK", f"-> {st6}")
    st7, _ = post(TA, "/tournament/exportLogs", {"matchId": mid}, AUTH)
    ok("exportLogs (auth) ->200", st7 == 200, f"-> {st7}")

# ================= FLOW 3: NFC PROVISIONING =================
def flow_nfc():
    print("--- Flow 3: NFC card provisioning ---")
    import uuid as _uuid
    test_card = "GATE" + _uuid.uuid4().hex[:12].upper()  # unique per run, avoids 409 on replay
    try:
        hcode = udp()
    except Exception:
        hcode = -1
    ok("nfc /health ->200", hcode == 200, f"-> {hcode}")
    st, resp = post(NFC, "/issueWriteToken", {"userId": "u1", "cardUid": test_card, "operation": "register"})
    tok = resp.get("writeToken")
    ok("issueWriteToken ->200", st == 200 and bool(tok), f"-> {st}")
    st2, r2 = post(NFC, "/validateWriteToken", {"token": tok, "cardUid": test_card, "fields": ["owner_id"]})
    ok("validateWriteToken ->200 OK", st2 == 200 and r2.get("status") == "OK", f"-> {st2}")
    st2b, _ = post(NFC, "/validateWriteToken", {"token": tok, "cardUid": "OTHERCARD", "fields": ["owner_id"]})
    ok("validate wrong card ->403", st2b == 403, f"-> {st2b}")
    st3, r3 = post(NFC, "/registerCard", {"token": tok, "cardUid": test_card, "cardType": "monster", "checksum": "chk-gate", "immutableData": {"cardId": 210, "name": "Gate #210"}})
    ok("registerCard ->200 OK", st3 == 200 and r3.get("status") == "OK", f"-> {st3}")
    _, cnt = db(f"SELECT count(*) FROM card_registry WHERE card_uid='{test_card}';")
    ok("card persisted in registry", cnt.isdigit() and int(cnt) >= 1, f"-> {cnt}")
    st7, _ = post(NFC, "/registerCard", {"token": "Zm9v.bar", "cardUid": "X", "cardType": "monster", "checksum": "y", "immutableData": {}})
    ok("bad token register ->401", st7 == 401, f"-> {st7}")

# ================= CONTRACT: client HMAC matches backend =================
def flow_contract():
    print("--- Contract: UE client HMAC == backend hmacAuth ---")
    # Replicate the exact C++ contract and prove the live backend accepts it.
    body = {"userId": UID, "action": "MOVE", "battleId": BID}
    ts = int(time.time())
    b = b64(body)
    sig = hmac.new(HMAC_SECRET, (b + "|" + str(ts)).encode(), hashlib.sha256).hexdigest()
    h = {"Content-Type": "application/json", "x-user-id": UID, "x-timestamp": str(ts), "x-signature": sig}
    data = json.dumps(body, separators=(",", ":")).encode()
    req = urllib.request.Request(AC + "/issueNonce", data=data, headers=h, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=6) as r:
            st = r.status; resp = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        st = e.code; resp = {}
    ok("client HMAC contract accepted by anti-cheat ->200", st == 200 and bool(resp.get("nonce")), f"-> {st}")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-db", action="store_true", help="skip docker/psql-dependent flows")
    args = ap.parse_args()
    print("=== AURA CHAMPIONS E2E GATE ===")
    if args.no_db:
        flow_contract()
    else:
        flow_battle()
        flow_tournament()
        flow_nfc()
        flow_contract()
    print(f"\nRESULT: {passed} passed, {failed} failed")
    sys.exit(1 if failed else 0)

if __name__ == "__main__":
    main()
