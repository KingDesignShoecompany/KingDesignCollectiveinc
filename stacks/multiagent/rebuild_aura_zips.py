import os, zipfile, shutil

BASES = [
    r"C:/Users/young/stacks/multiagent/agent_zero_usr/skills",
    r"C:/Users/young/a0_usr/skills",
]
SKILLS = ["backend-master","ue-client","nfc-handler","anti-cheat","trinity-special","tournament-admin"]
ROOT_FILES = ["deploy_skills.sh","deploy_skills.bat","docker-compose.yml",".env.example"]

def zip_dir(zf, d, arc_root):
    for root, dirs, files in os.walk(d):
        # skip junk
        dirs[:] = [d for d in dirs if d not in ("__pycache__", ".git", "node_modules")]
        for f in files:
            fp = os.path.join(root, f)
            rel = os.path.relpath(fp, arc_root).replace("\\", "/")
            zf.write(fp, rel)

def zip_files(zf, files, arc_root):
    for f in files:
        fp = os.path.join(arc_root, f)
        if os.path.isfile(fp):
            zf.write(fp, f)

for base in BASES:
    print("===", base)
    # Individual skill zips
    for sk in SKILLS:
        src = os.path.join(base, sk)
        zpath = os.path.join(base, f"{sk}-skill.zip")
        if os.path.exists(zpath): os.remove(zpath)
        with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as zf:
            zip_dir(zf, src, base)
        print(f"  {sk}-skill.zip  ({len(zipfile.ZipFile(zpath).namelist())} entries)")

    # Combined packages
    for name in ["aura-champions-skills-all.zip", "aura-champions-agent-zero-skills.zip"]:
        zpath = os.path.join(base, name)
        if os.path.exists(zpath): os.remove(zpath)
        with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as zf:
            for sk in SKILLS + ["aura-validation"]:
                d = os.path.join(base, sk)
                if os.path.isdir(d): zip_dir(zf, d, base)
            # systemd dir
            sd = os.path.join(base, "systemd")
            if os.path.isdir(sd): zip_dir(zf, sd, base)
            zip_files(zf, ROOT_FILES, base)
        print(f"  {name}  ({len(zipfile.ZipFile(zpath).namelist())} entries)")

print("DONE")
