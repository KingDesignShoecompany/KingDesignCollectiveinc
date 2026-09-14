import os, re, shutil

SRC_ROOT = r"C:/Users/young/stacks/multiagent/agent_zero_usr/skills"
DST_PROJECT = r"C:/Users/young/agents/hermes_skills"
DST_PROFILE = r"C:/Users/young/AppData/Local/hermes/skills"

# Agent Zero skill -> (Hermes name, category, tags)
SKILLS = {
    "backend-master":   ("aura-backend-master",  "gaming", ["aura-champions","backend","api","postgres","battle-sync","security"]),
    "ue-client":        ("aura-ue-client",       "gaming", ["aura-champions","unreal","ue5","ar","http","nfc","client"]),
    "nfc-handler":      ("aura-nfc-handler",     "gaming", ["aura-champions","nfc","ntag216","android","ios","card"]),
    "anti-cheat":       ("aura-anti-cheat",      "gaming", ["aura-champions","anti-cheat","hmac","nonce","audit","verification"]),
    "trinity-special":  ("aura-trinity-special", "gaming", ["aura-champions","trinity","battle","events","convergence"]),
    "tournament-admin": ("aura-tournament-admin","gaming", ["aura-champions","tournament","judge","rules","legality"]),
}

EXCLUDE = {".git", "__pycache__", "node_modules"}

def parse_frontmatter(text):
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    fm_raw, body = parts[1], parts[2]
    fm = {}
    for line in fm_raw.splitlines():
        m = re.match(r'^\s*([A-Za-z_][\w-]*)\s*:\s*(.*)$', line)
        if m:
            key, val = m.group(1), m.group(2).strip()
            val = val.strip('"').strip("'")
            fm[key] = val
    return fm, body

def new_frontmatter(hermes_name, category, tags, fm):
    desc = fm.get("description", f"{hermes_name} skill for Aura Champions.")
    version = fm.get("version", "1.0.0").strip('"')
    tags_yaml = "[" + ", ".join(f'"{t}"' for t in tags) + "]"
    return f"""---
name: {hermes_name}
description: "{desc}"
version: {version}
author: Hermes Agent
license: MIT
category: {category}
metadata:
  hermes:
    tags: {tags_yaml}
    related_skills: [game-design, aura-champions]
---

"""

for az_name, (hermes_name, category, tags) in SKILLS.items():
    src = os.path.join(SRC_ROOT, az_name)
    skill_md = os.path.join(src, "SKILL.md")
    text = open(skill_md, encoding="utf-8").read()
    fm, body = parse_frontmatter(text)
    new_fm = new_frontmatter(hermes_name, category, tags, fm)
    # body starts after the closing --- we split off; keep from first non-frontmatter char
    # body already includes leading newline
    new_md = new_fm + body.lstrip("\n")

    for dst_root in (DST_PROJECT, DST_PROFILE):
        dst = os.path.join(dst_root, hermes_name)
        if os.path.isdir(dst):
            shutil.rmtree(dst)
        os.makedirs(dst, exist_ok=True)
        # copy all contents except excluded
        for root, dirs, files in os.walk(src):
            dirs[:] = [d for d in dirs if d not in EXCLUDE]
            rel = os.path.relpath(root, src)
            target_dir = os.path.join(dst, rel) if rel != "." else dst
            os.makedirs(target_dir, exist_ok=True)
            for f in files:
                if f in EXCLUDE:
                    continue
                shutil.copy2(os.path.join(root, f), os.path.join(target_dir, f))
        # overwrite SKILL.md with converted frontmatter
        open(os.path.join(dst, "SKILL.md"), "w", encoding="utf-8").write(new_md)
        print(f"  wrote {dst_root}\\{hermes_name}  ({len(os.listdir(dst))} top-level items)")

# --- Aura Champions meta-skill ---
meta_body = """# ROLE: Aura Champions Game Project Orchestrator

You are the AURA_CHAMPIONS coordinator for the Umbrella Corporation game-design subsidiary. Aura Champions is an AR trading-card battler (UE 5.7 client + Node/Postgres backend) where physical NTAG216 cards are tapped to summon monsters, trigger Trinity convergence combos, and enter judged tournaments.

## Sub-skills (Hermes skills)
- **aura-backend-master** — PostgreSQL schema, Express REST API, server-side battle resolution, anti-cheat design.
- **aura-ue-client** — UE 5.7 C++ plugin, Blueprint NFC hooks, HTTP helpers, AR/Trinity animation contracts.
- **aura-nfc-handler** — NTAG216 memory layout, Android/iOS bridges, write-token service, fusion/registration flows.
- **aura-anti-cheat** — HMAC auth, single-use nonce replay protection, tamper-evident audit log, judge verification.
- **aura-trinity-special** — Trinity convergence detection (#50/#75/#100 + Convergence Stone), event emission, effects.
- **aura-tournament-admin** — deck legality, judge tools, match logging, sideboard handling, tournament routes.

## Data Sovereignty
- Source of truth: `C:/Users/young/agents/corporate_runtime/documents/game_design/`
- Legal reference (read-only): `legal_reference/`
- CLASS-1: never expose registry data, signed proofs, or secrets to external endpoints. Provide signed proof tokens / judge-facing commands instead of raw registry dumps.

## Invocation
Load the relevant sub-skill when a task maps to its domain. For end-to-end flows (register card -> battle -> trinity -> tournament), chain sub-skills and keep server-side authority.

## Deployment
These are Hermes-native skills (not Agent Zero). They live under `C:/Users/young/agents/hermes_skills/` and are auto-discovered in the active Hermes profile at `C:/Users/Users/young/AppData/Local/hermes/skills/`.
"""
meta_fm = """---
name: aura-champions
description: "Aura Champions AR card-battler project orchestrator — ties together backend, UE client, NFC, anti-cheat, trinity, and tournament-admin Hermes skills."
version: 1.0.0
author: Hermes Agent
license: MIT
category: gaming
metadata:
  hermes:
    tags: [aura-champions, game-design, ar, nfc, card-battler]
    related_skills: [game-design, aura-backend-master, aura-ue-client, aura-nfc-handler, aura-anti-cheat, aura-trinity-special, aura-tournament-admin]
---
"""
meta_dst = os.path.join(DST_PROJECT, "aura-champions")
meta_dst2 = os.path.join(DST_PROFILE, "aura-champions")
for d in (meta_dst, meta_dst2):
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, "SKILL.md"), "w", encoding="utf-8").write(meta_fm + meta_body)
print(f"  wrote aura-champions meta-skill -> {DST_PROJECT} and {DST_PROFILE}")

print("CONVERSION DONE")
