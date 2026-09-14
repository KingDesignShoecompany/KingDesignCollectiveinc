#!/usr/bin/env python3
# aura_gen_secrets.py
# Generates strong, unique secrets for the Aura Champions stack and writes them
# to .env (gitignored). Idempotent: only fills keys that are missing/placeholder.
# Run:  python aura_gen_secrets.py            (writes/updates .env next to script)
#       python aura_gen_secrets.py --show     (print generated values, no write)
import os, secrets, argparse, re

ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
PLACEHOLDER = re.compile(r"^(replace[-\w]*|changeme|your[-_]\w+|.*<.*>.*)$", re.I)

SPEC = {
    "HMAC_MASTER_SECRET": 48,   # anti-cheat + backend + client HMAC (must match across all)
    "JWT_SECRET": 48,           # tournament/judge bearer auth
    "WRITE_TOKEN_SECRET": 48,   # nfc-handler write tokens
    "AUDIT_SIGNING_SECRET": 48, # anti-cheat / tournament audit log signatures
    "DB_PASSWORD": 32,          # postgres aura user
}

def gen(nbytes):
    return secrets.token_urlsafe(nbytes)

def load_existing():
    env = {}
    if os.path.exists(ENV_PATH):
        for line in open(ENV_PATH, encoding="utf-8"):
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--show", action="store_true", help="print values instead of writing")
    args = ap.parse_args()

    env = load_existing()
    generated = {}
    for key, n in SPEC.items():
        cur = env.get(key, "")
        if not cur or PLACEHOLDER.match(cur):
            val = gen(n)
            env[key] = val
            generated[key] = val
        else:
            generated[key] = "<unchanged>"

    if args.show:
        for k, v in generated.items():
            print(f"{k}={v}")
        return

    # Preserve any other existing keys, write all.
    with open(ENV_PATH, "w", encoding="utf-8") as f:
        f.write("# Aura Champions stack secrets (gitignored). Source into docker compose.\n")
        for k, v in env.items():
            f.write(f"{k}={v}\n")
    print(f"Wrote {len(SPEC)} managed secrets to {ENV_PATH}")
    for k, v in generated.items():
        print(f"  {k}: {'REGENERATED' if v != '<unchanged>' else 'kept existing'}")

if __name__ == "__main__":
    main()
