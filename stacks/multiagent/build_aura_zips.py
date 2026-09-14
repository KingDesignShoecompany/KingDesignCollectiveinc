#!/usr/bin/env python
# Rebuild Aura Champions Hermes-skill distributable zips from the canonical PROJECT tree.
# Produces: per-skill <name>.zip and aura-champions-hermes-all.zip under _packages/.
import os, zipfile, shutil

PROJECT = r"C:/Users/young/agents/hermes_skills"
PKG = os.path.join(PROJECT, "_packages")
SKILLS = ["aura-champions","aura-backend-master","aura-ue-client","aura-nfc-handler",
          "aura-anti-cheat","aura-trinity-special","aura-tournament-admin"]
EXCLUDE = {".git","__pycache__","node_modules"}

def zip_dir(zf, d, arc_root):
    for root, dirs, files in os.walk(d):
        dirs[:] = [x for x in dirs if x not in EXCLUDE]
        for f in files:
            if f in EXCLUDE: continue
            fp = os.path.join(root, f)
            rel = os.path.relpath(fp, arc_root).replace("\\", "/")
            zf.write(fp, rel)

os.makedirs(PKG, exist_ok=True)
# clean stale hermes-format zips (keep compose yml + legacy agent-zero zips untouched)
for f in os.listdir(PKG):
    if f.endswith(".zip") and ("hermes" in f or f in [s+".zip" for s in SKILLS]):
        os.remove(os.path.join(PKG, f))

# per-skill zips
for sk in SKILLS:
    src = os.path.join(PROJECT, sk)
    zpath = os.path.join(PKG, f"{sk}.zip")
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as zf:
        zip_dir(zf, src, PROJECT)
    print(f"  {sk}.zip  ({len(zipfile.ZipFile(zpath).namelist())} entries)")

# all-in-one
allpath = os.path.join(PKG, "aura-champions-hermes-all.zip")
with zipfile.ZipFile(allpath, "w", zipfile.ZIP_DEFLATED) as zf:
    for sk in SKILLS:
        zip_dir(zf, os.path.join(PROJECT, sk), PROJECT)
print(f"  aura-champions-hermes-all.zip  ({len(zipfile.ZipFile(allpath).namelist())} entries)")
print("BUILD DONE")
