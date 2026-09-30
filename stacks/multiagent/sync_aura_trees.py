#!/usr/bin/env python
# Sync the two Aura Champions Hermes skill deploy trees to full parity (union of files).
# Trees:
#   PROJECT = C:/Users/young/agents/hermes_skills          (canon source)
#   PROFILE  = C:/Users/young/AppData/Local/hermes/skills   (active Hermes profile)
# Rationale: a prior generation run wrote each skill into both trees but diverged;
# PROFILE has the richer aura-champions meta-skill + references/, while PROJECT has
# the package.json / self-containment helper src files the docker runtime needs.
import os, shutil

PROJECT = r"C:/Users/young/agents/hermes_skills"
PROFILE = r"C:/Users/young/AppData/Local/hermes/skills"
SKILLS = ["aura-champions","aura-backend-master","aura-ue-client","aura-nfc-handler",
          "aura-anti-cheat","aura-trinity-special","aura-tournament-admin"]
EXCLUDE = {".git","__pycache__","node_modules"}

def relfiles(root, sk):
    out = set()
    d = os.path.join(root, sk)
    if not os.path.isdir(d): return out
    for dp, dirs, files in os.walk(d):
        dirs[:] = [x for x in dirs if x not in EXCLUDE]
        rel = os.path.relpath(dp, d)
        for f in files:
            if f in EXCLUDE: continue
            out.add(os.path.join(rel, f) if rel != "." else f)
    return out

def copy_file(src_root, dst_root, sk, relpath):
    s = os.path.join(src_root, sk, relpath)
    t = os.path.join(dst_root, sk, relpath)
    os.makedirs(os.path.dirname(t), exist_ok=True)
    shutil.copy2(s, t)
    print(f"  copy {relpath}  -> {os.path.basename(dst_root)}/{sk}")

ops = 0
for sk in SKILLS:
    a = relfiles(PROJECT, sk)
    b = relfiles(PROFILE, sk)
    # PROFILE lacks what PROJECT has
    for f in sorted(a - b):
        copy_file(PROJECT, PROFILE, sk, f); ops += 1
    # PROJECT lacks what PROFILE has (file additions only; meta-skill handled below)
    for f in sorted(b - a):
        copy_file(PROFILE, PROJECT, sk, f); ops += 1

# Upgrade the stale aura-champions meta-skill in PROJECT to the richer PROFILE version.
p_meta = os.path.join(PROFILE, "aura-champions", "SKILL.md")
j_meta = os.path.join(PROJECT, "aura-champions", "SKILL.md")
if os.path.getsize(p_meta) > os.path.getsize(j_meta):
    shutil.copy2(p_meta, j_meta)
    print(f"  upgrade aura-champions/SKILL.md (PROJECT) <- PROFILE richer version"); ops += 1

print(f"SYNC DONE: {ops} file operations")
