#!/usr/bin/env python3
# AD-HOC reusable HMAC-signed end-to-end Aura battle probe.
# Run AFTER: docker compose -f _packages/aura-champions-compose.yml up -d
# Mirrors references/aura-docker-runtime.md recipe but executable.
# Expect: issueNonce 200 -> battleSync 200 SUCCESS -> replay 403.
import hmac, hashlib, base64, json, urllib.request, urllib.error, time, subprocess, sys

SEC = b"replace-with-strong-secret"
URL = "http://localhost"
BID = "11111111-1111-1111-1111-111111111111"
UID = "22222222-2222-2222-2222-222222222222"

def b64(o):
    return base64.b64encode(json.dumps(o, separators=(",", ":")).encode()).decode()

def post(port, path, body, user=UID):
    ts = int(time.time()); bb = b64(body)
    sig = hmac.new(SEC, (bb + "|" + str(ts)).encode(), hashlib.sha256).hexdigest()
    req = urllib.request.Request(
        f"{URL}:{port}{path}",
        data=json.dumps(body, separators=(",", ":")).encode(),
        headers={"Content-Type": "application/json",
                 "x-timestamp": str(ts), "x-signature": sig, "x-user-id": user},
        method="POST")
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except Exception:
            return e.code, {}

def seed_battle():
    sql = (f"INSERT INTO battles(id,state_version,players) VALUES('{BID}',0,'[]'::jsonb) "
           f"ON CONFLICT (id) DO UPDATE SET state_version=0, players='[]'::jsonb;")
    r = subprocess.run(["docker", "exec", "packages-db-1", "psql", "-U", "aura", "-d", "aura",
                        "-c", sql], capture_output=True, text=True)
    if r.returncode != 0:
        print("SEED FAILED:", r.stderr); sys.exit(1)
    print("seeded battle", BID)

def main():
    seed_battle()
    st, resp = post(3101, "/issueNonce", {"battleId": BID})
    nonce = resp.get("nonce")
    print(f"[1] issueNonce        -> {st}  nonce={nonce}")
    st2, r2 = post(3100, "/battleSync",
                   {"battleId": BID, "userId": UID, "action": "MOVE", "nonce": nonce, "stateVersion": 0})
    print(f"[2] battleSync (1st)   -> {st2}  {json.dumps(r2)[:120]}")
    st3, r3 = post(3100, "/battleSync",
                   {"battleId": BID, "userId": UID, "action": "MOVE", "nonce": nonce, "stateVersion": 0})
    print(f"[3] battleSync (replay)-> {st3}  {json.dumps(r3)[:120]} (expect 403/409)")
    result = "PASS" if (st == 200 and st2 in (200, 201) and st3 in (403, 409)) else "INVESTIGATE"
    print("\nRESULT:", result)
    sys.exit(0 if result == "PASS" else 1)

if __name__ == "__main__":
    main()
